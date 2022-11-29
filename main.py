from flask import Flask, render_template, jsonify, request
import json

# ADD GUNICORN AFTER THIS. We dont want Flask debugs. I dont even need Flask as of now.

app = Flask(__name__)


@app.route('/')
def index():
    return render_template("index.html")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)