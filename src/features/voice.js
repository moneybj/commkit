/**
 * CommKit Voice
 * Web Speech API wrapper with state machine
 * States: idle → listening → done | error
 */

export class VoiceInput {
  constructor({ onTranscript, onFinal, onStateChange, onError }) {
    this.onTranscript  = onTranscript   // (text, isFinal) => void
    this.onFinal       = onFinal        // (text) => void
    this.onStateChange = onStateChange  // (state) => void
    this.onError       = onError        // (message) => void

    this.recognition     = null
    this.isListening     = false
    this.finalTranscript = ''
    this.supported       = this._checkSupport()
  }

  _checkSupport() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  get isSupported() {
    return this.supported
  }

  _setup() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    this.recognition = new SR()
    this.recognition.continuous      = true
    this.recognition.interimResults  = true
    this.recognition.lang            = 'en-US'
    this.recognition.maxAlternatives = 1

    this.recognition.onstart = () => {
      this.isListening = true
      this.onStateChange('listening')
    }

    this.recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          this.finalTranscript += transcript + ' '
        } else {
          interim = transcript
        }
      }
      this.onTranscript(this.finalTranscript + interim, !interim)
    }

    this.recognition.onend = () => {
      this.isListening = false
      if (this.finalTranscript.trim().length > 0) {
        this.onStateChange('done')
        this.onFinal(this.finalTranscript.trim())
      } else {
        this.onStateChange('idle')
      }
    }

    this.recognition.onerror = (event) => {
      this.isListening = false
      this.onStateChange('error')

      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          this.onError('Microphone access denied. Enable it in your browser settings.')
          break
        case 'no-speech':
          this.onError('No speech detected — tap the mic and try again.')
          this.onStateChange('idle')
          break
        case 'network':
          this.onError('Network error — check your connection.')
          break
        default:
          this.onError('Something went wrong — tap to try again.')
      }
    }
  }

  start() {
    if (!this.supported) return
    this.finalTranscript = ''

    // Recreate recognition each time (iOS Safari requirement)
    this._setup()

    try {
      this.recognition.start()
    } catch (err) {
      console.warn('[CommKit Voice] Start error:', err)
      this._setup()
      this.recognition.start()
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
    this.isListening = false
  }

  reset() {
    this.stop()
    this.finalTranscript = ''
    this.onStateChange('idle')
  }

  get transcript() {
    return this.finalTranscript.trim()
  }
}
