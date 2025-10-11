// src/utils/audioManager.js
class AudioManager {
  constructor() {
    this.currentAudio = null;
    this.currentAyat = null;
    this.currentSuratId = null;
  }

  playAudio(audioUrl, suratId, ayatNomor, onPlaying, onError, onEnded) {
    // Stop audio yang sedang berjalan
    this.stopCurrentAudio();

    // Buat audio baru
    this.currentAudio = new Audio(audioUrl);
    this.currentSuratId = suratId;
    this.currentAyat = ayatNomor;

    this.currentAudio.onplaying = () => {
      onPlaying && onPlaying();
    };

    this.currentAudio.onerror = () => {
      onError && onError();
      this.stopCurrentAudio();
    };

    this.currentAudio.onended = () => {
      onEnded && onEnded();
      this.stopCurrentAudio();
    };

    this.currentAudio.play().catch(error => {
      onError && onError();
      this.stopCurrentAudio();
    });
  }

  stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.currentSuratId = null;
      this.currentAyat = null;
    }
  }

  isPlaying(suratId, ayatNomor) {
    return this.currentSuratId === suratId && this.currentAyat === ayatNomor && this.currentAudio;
  }

  getCurrentPlaying() {
    return {
      suratId: this.currentSuratId,
      ayatNomor: this.currentAyat
    };
  }
}

// Export singleton instance
export default new AudioManager();