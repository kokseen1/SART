from os import environ
from flask import Flask, abort, render_template, jsonify, request
from scrape import *
import json

app = Flask(__name__)

main_season_url = "https://myanimelist.net/anime/season"


@app.route("/", methods=["GET", "POST"])
def loading_page():
    if request.method == "GET":
        url = ""
    if request.method == "POST":
        url = request.form.get("url")
    return render_template("index.html", url=url)


@app.route("/countdown_ajax", methods=["POST"])
def main_dir():
    url = request.data
    return jsonify(get_countdowns(url))
    # For testing
    return jsonify([
        ("title1", 123, "12345", "3.6"),
        ("title2", 412, "35124", "8.6"),
        ("title4", 6435, "3541624", "2.6"),
        ("title5", 5235, "3571224", "7.3"),
        ("title6", 142, "3531724", "4.6"),
        ("title3", 12, "53321", "6.6"), "https://myanimelist.net/anime/season/2022/winter", "https://myanimelist.net/anime/season/2021/summer", "Fall 2021"
    ])


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
