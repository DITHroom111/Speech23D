from flask import Flask, Response, request, render_template
from google.cloud.speech import enums, types, SpeechClient
from parse_command import parse_command
import pyaudio
import os


app = Flask(__name__)

client = SpeechClient()

os.environ.setdefault('GOOGLE_APPLICATION_CREDENTIALS', 'key.json')


@app.route('/upload', methods=['POST'])
def upload():
    raw_audio = request.files['audio_data']
    content = raw_audio.read()
    audio = types.RecognitionAudio(content=content)
    config = types.RecognitionConfig(
        encoding=enums.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=44100,
        language_code='en-US',
    )
    response = client.recognize(config, audio)
    print(response)
    for result in response.results:
        voice_command = result.alternatives[0].transcript
        return parse_command(voice_command)


@app.route('/')
def init_recorder():
    return render_template('index.html')


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=5000)
