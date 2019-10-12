from flask import Flask, Response, render_template
import pyaudio


app = Flask(__name__)

FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 44100
CHUNK = 1024
RECORD_SECONDS = 5

audio1 = pyaudio.PyAudio()


def gen_header(sample_rate, bits_per_sample, channels):
    datasize = 2000*10**6
    o = bytes("RIFF", 'ascii')
    o += (datasize + 36).to_bytes(4, 'little')
    o += bytes("WAVE", 'ascii')
    o += bytes("fmt ", 'ascii')
    o += (16).to_bytes(4, 'little')
    o += (1).to_bytes(2, 'little')
    o += (channels).to_bytes(2, 'little')
    o += (sample_rate).to_bytes(4, 'little')
    o += (sample_rate * channels * bits_per_sample // 8).to_bytes(4, 'little')
    o += (channels * bits_per_sample // 8).to_bytes(2, 'little')
    o += (bits_per_sample).to_bytes(2, 'little')
    o += bytes("data", 'ascii')
    o += (datasize).to_bytes(4, 'little')
    return o


@app.route('/audio')
def audio():
    # start Recording
    def sound():
        CHUNK = 1024
        sample_rate = 44100
        bits_per_sample = 16
        channels = 2
        wav_header = gen_header(sample_rate, bits_per_sample, channels)

        stream = audio1.open(
            format=FORMAT, channels=CHANNELS,
            rate=RATE, input=True, input_device_index=1,
            frames_per_buffer=CHUNK,
        )
        print("recording...")
        # frames = []

        while True:
            data = wav_header + stream.read(CHUNK)
            yield(data)
    return Response(sound())


@app.route('/')
def index():
    """Video streaming home page."""
    return render_template('index.html')


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=5000)
