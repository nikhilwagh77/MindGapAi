/* ----------------------------------------------------
   MindGap AI - Multimodal Input Controller
   Handles Scratchpad Camera/Uploads & Speech Audio
   ---------------------------------------------------- */

window.MultimodalController = {
    mediaRecorder: null,
    audioChunks: [],
    isRecording: false,
    webcamStream: null,

    init: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        const imageInput = document.getElementById('image-input');
        const btnWebcam = document.getElementById('btn-webcam');
        const btnCloseWebcam = document.getElementById('btn-close-webcam');
        const btnCancelCam = document.getElementById('btn-cancel-cam');
        const btnCaptureCam = document.getElementById('btn-capture-cam');
        const btnClearImage = document.getElementById('btn-clear-image');
        const btnRecordAudio = document.getElementById('btn-record-audio');

        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }

        if (btnWebcam) {
            btnWebcam.addEventListener('click', () => this.openWebcamModal());
        }

        if (btnCloseWebcam) btnCloseWebcam.addEventListener('click', () => this.closeWebcamModal());
        if (btnCancelCam) btnCancelCam.addEventListener('click', () => this.closeWebcamModal());
        if (btnCaptureCam) btnCaptureCam.addEventListener('click', () => this.captureWebcamImage());
        if (btnClearImage) btnClearImage.addEventListener('click', () => this.clearImage());

        if (btnRecordAudio) {
            btnRecordAudio.addEventListener('click', () => this.toggleAudioRecording());
        }
    },

    handleImageUpload: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.showImagePreview(e.target.result);
            this.triggerSimulatedOCR("Custom Handwritten Upload Processed by Gemini Vision");
        };
        reader.readAsDataURL(file);
    },

    showImagePreview: function(imageSrc) {
        const placeholder = document.getElementById('upload-placeholder');
        const previewContainer = document.getElementById('preview-container');
        const previewImg = document.getElementById('image-preview');

        if (placeholder && previewContainer && previewImg) {
            previewImg.src = imageSrc;
            placeholder.classList.add('hidden');
            previewContainer.classList.remove('hidden');
        }
    },

    clearImage: function() {
        const placeholder = document.getElementById('upload-placeholder');
        const previewContainer = document.getElementById('preview-container');
        const imageInput = document.getElementById('image-input');

        if (placeholder && previewContainer) {
            placeholder.classList.remove('hidden');
            previewContainer.classList.add('hidden');
            if (imageInput) imageInput.value = '';
        }
    },

    openWebcamModal: function() {
        const modal = document.getElementById('webcam-modal');
        const video = document.getElementById('webcam-video');
        if (!modal || !video) return;

        modal.classList.remove('hidden');

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then((stream) => {
                    this.webcamStream = stream;
                    video.srcObject = stream;
                })
                .catch((err) => {
                    console.warn("Webcam access error / permission denied:", err);
                    alert("Camera access unavailable. Loading pre-set scratchpad sample!");
                    this.closeWebcamModal();
                    this.showSampleScratchpad();
                });
        } else {
            this.showSampleScratchpad();
        }
    },

    closeWebcamModal: function() {
        const modal = document.getElementById('webcam-modal');
        const video = document.getElementById('webcam-video');
        if (modal) modal.classList.add('hidden');

        if (this.webcamStream) {
            this.webcamStream.getTracks().forEach(track => track.stop());
            this.webcamStream = null;
        }
        if (video) video.srcObject = null;
    },

    captureWebcamImage: function() {
        const video = document.getElementById('webcam-video');
        const canvas = document.getElementById('webcam-canvas');
        if (!video || !canvas) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/png');
        this.showImagePreview(dataUrl);
        this.closeWebcamModal();
        this.triggerSimulatedOCR("Live Camera Snapshot Processed");
    },

    showSampleScratchpad: function() {
        // Generate synthetic scratchpad canvas image
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 400, 200);

        ctx.fillStyle = '#00f0ff';
        ctx.font = '16px "Fira Code", monospace';
        ctx.fillText('v = u + at  =>  0 = 20 - 9.8t', 20, 40);
        ctx.fillText('t = 2.04 s', 20, 80);
        ctx.fillStyle = '#ff0055';
        ctx.fillText('h = 20(2.04) + 9.8(2.04)^2', 20, 120);
        ctx.fillText('   [Sign Error: Added +g]', 20, 150);

        this.showImagePreview(canvas.toDataURL());
    },

    toggleAudioRecording: function() {
        const btn = document.getElementById('btn-record-audio');
        const status = document.getElementById('record-status');
        const visualizer = document.getElementById('mic-visualizer');
        const transcriptText = document.getElementById('transcript-text');

        if (!this.isRecording) {
            // Start recording
            this.isRecording = true;
            if (btn) btn.classList.add('recording');
            if (status) status.innerHTML = "<span class='text-danger'>Listening & Analyzing Hesitation...</span>";
            if (visualizer) visualizer.classList.add('recording');

            // Web Speech Recognition if supported
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = true;

                this.recognition.onresult = (event) => {
                    let interim = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        interim += event.results[i][0].transcript;
                    }
                    if (transcriptText) transcriptText.innerText = `"${interim}"`;
                };

                this.recognition.start();
            }

            // Auto stop after 5 seconds for demo ease
            setTimeout(() => {
                if (this.isRecording) this.toggleAudioRecording();
            }, 6000);
        } else {
            // Stop recording
            this.isRecording = false;
            if (btn) btn.classList.remove('recording');
            if (status) status.innerText = "Audio captured & transcribed!";
            if (visualizer) visualizer.classList.remove('recording');

            if (this.recognition) {
                try { this.recognition.stop(); } catch(e){}
            }
        }
    },

    triggerSimulatedOCR: function(sourceNote) {
        const ocrText = document.getElementById('ocr-text');
        if (ocrText) {
            ocrText.innerHTML = `<strong>[OCR - ${sourceNote}]</strong><br>` + ocrText.innerHTML;
        }
    }
};
