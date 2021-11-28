from bs4 import BeautifulSoup
import requests
import datetime
from math import ceil
import time
main_season_url = "https://myanimelist.net/anime/season"


def retrieve_soup(url):
    content = requests.get(url).text
    # with open("last_html.html", "r") as f:
    # content = f.read()
    # with open("last_html.html", "w",encoding="utf8") as f:
    #     f.write(content)
    # start = time.time()
    soup = BeautifulSoup(content, features="lxml")
    # print(time.time() - start)
    return soup


def parse_start_date(start_date):
    if start_date.endswith(" (JST)"):
        start_date = start_date.rstrip(" (JST)")
    else:
        start_date += ", 00:00"
    date_time_today = datetime.datetime.today() - datetime.timedelta(hours=-9)
    try:
        parsed_date = datetime.datetime.strptime(
            start_date, "%b %d, %Y, %H:%M")
    except ValueError:
        return
    if parsed_date > date_time_today:
        days_time_until = parsed_date - date_time_today
        return days_time_until.total_seconds()
    else:
        days_time_since = (date_time_today-parsed_date)
        # Round up days in multiples of 7
        rounded_days = 7 * ceil(days_time_since.days/7+0.01)
        days_time_until = datetime.timedelta(
            days=rounded_days) - days_time_since
        return days_time_until.total_seconds()


def get_countdowns(url=main_season_url):
    if not url:
        url = main_season_url
    main_url_soup = retrieve_soup(url)
    shows_list = main_url_soup.find_all(
        "div", {"class": "seasonal-anime js-seasonal-anime"})
    title_countdown_list = []
    for show in shows_list:
        title_a = show.find("a", {"class": "link-title"})
        show_title = title_a.text.strip()
        start_date = show.find("span", {"class": "remain-time"}).text.strip()
        popularity = show.find(
            "span", {"class": "member fl-r"}).text.strip().replace(",", "")
        score = show.find("span", {"title": "Score"}).text.strip()
        mal_url = title_a["href"]
        splitted_img_src = str(show.find("img")).split('"')
        for line in splitted_img_src:
            if line.startswith("https://cdn") and line.endswith(".jpg"):
                img_src = line
                break
        parsed_start_date = parse_start_date(start_date)
        if parsed_start_date:
            title_countdown_list.append(
                (show_title, round(parsed_start_date), popularity, score, img_src, mal_url))

    season_li_list = main_url_soup.find(
        "div", {"class": "horiznav_nav"}).find("ul").find_all("li")
    prev_li = season_li_list[1]
    next_li = season_li_list[3]
    title_countdown_list.append(next_li.a["href"])
    title_countdown_list.append(prev_li.a["href"])
    current_season = main_url_soup.find(
        "h1", {"class": "season_nav"}).a.text.strip()
    title_countdown_list.append(current_season)
    # print(title_countdown_list)
    return title_countdown_list
