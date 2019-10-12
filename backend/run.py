from flask import Flask, Response, request, render_template
import pyaudio


app = Flask(__name__)

FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 44100
CHUNK = 1024
RECORD_SECONDS = 5


@app.route('/upload', methods=['POST'])
def upload():
    raw_audio = request.get_data()
    with open('recored_file.wav', 'wb') as f_out:
        f_out.write(raw_audio)
    return 'joke'


@app.route('/')
def init_recorder():
    return render_template('index.html')


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=5000)
