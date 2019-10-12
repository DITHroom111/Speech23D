from flask import Flask, request, render_template
from google.cloud.speech import enums, types, SpeechClient

import json
import os
import traceback

from parse_command import parse_command


app = Flask(__name__)

os.environ.setdefault('GOOGLE_APPLICATION_CREDENTIALS', 'key.json')

client = SpeechClient()


@app.route('/upload', methods=['POST'])
def upload():
    raw_audio = request.files['audio_data']
    content = raw_audio.read()
    audio = types.RecognitionAudio(content=content)
    config = types.RecognitionConfig(
        encoding=enums.RecognitionConfig.AudioEncoding.LINEAR16,
        language_code='en-US',)
    response = client.recognize(config, audio)
    print(response)
    for result in response.results:
        voice_command = result.alternatives[0].transcript
        try:
            parsed_command = parse_command(voice_command)
        except Exception as e:
            traceback.print_exc()
            return '"{}" command parsing failed'.format(voice_command)
        print(parsed_command)
        return json.dumps(parsed_command)
    return 'speech2text failed'


@app.route('/')
def init_recorder():
    return render_template('index.html')


@app.route('/upload_text', methods=['POST'])
def upload_text():
   text_command = request.form.get("text")
   print(request.form)
   try:
       parsed_command = parse_command(text_command)
   except Exception as e:
       traceback.print_exc()
       return '"{}" command parsing failed'.format(text_command)
   print(parsed_command)
   return json.dumps(parsed_command)  
    

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=5000)
