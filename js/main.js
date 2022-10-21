const DOMAIN = "https://api.jikan.moe/v4/seasons";
const WATCH_DOMAIN = "https://gogoanime.gg//search.html?keyword=";
const WATCH_DOMAIN2 = "https://9anime.to/filter?keyword=";
const seasons = ["winter", "spring", "summer", "fall"];
const weekdays_array = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const getSeason = d => Math.floor((d.getMonth() / 12 * 4)) % 4;
const now = new Date();

let curr_year = now.getFullYear();
let curr_season = getSeason(now);
let get_season_text = () => seasons.at(curr_season % 4);
let wrapper = document.getElementById("wrapper");

let faves = [];
let seconds_arr = [];
let functions_arr = [];
let faves_toggle = false;


if ($.cookie("faves_toggle") == null) {
    $.cookie("faves_toggle", "false", { expires: 9999 });
} else {
    faves_toggle = ($.cookie("faves_toggle") === "true");
}

if ($.cookie("faves") == null) {
    $.cookie("faves", JSON.stringify(faves), { expires: 9999 });
} else {
    faves = JSON.parse($.cookie("faves"));
}


Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}


let get_listings = () => {
    let listings = document.querySelectorAll("[data-countdown]");
    let listingsArray = Array.from(listings);
    return listingsArray;
};

let soonest_sort = (a, b) => {
    return (a.dataset.countdown - b.dataset.countdown);
};

let pop_sort = (a, b) => {
    return (b.dataset.popularity - a.dataset.popularity);
};

let recent_sort = (a, b) => {
    if (a.dataset.countdown > 604800) {
        return 1;
    } else if (b.dataset.countdown > 604800) {
        return -1;
    }
    return Math.abs(604800 - a.dataset.countdown) - Math.abs(604800 - b.dataset.countdown);
};

let score_sort = (a, b) => {
    if (a.dataset.score == "N/A") {
        return 1;
    } else if (b.dataset.score == "N/A") {
        return -1;
    } else {
        return b.dataset.score - a.dataset.score;
    }
};

function getTimeRemaining(endtime) {
    const total = Date.parse(endtime) - Date.parse(new Date());
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    return {
        total,
        days,
        hours,
        minutes,
        seconds
    };
}


let last_mode = score_sort;

function retrieve_season(year, season, page) {
    let season_url = `${DOMAIN}/${year}/${season}?page=${page}`;
    let compiled_series_arr = [];
    $.getJSON(season_url, function (data) {
        if (data.pagination.has_next_page) page += 1;
        else page = -1;
        $.each(data.data, function (i, item) {
            if (item.r18) return;
            // let airing_start = item.airing_start;
            let image_url = item.images.jpg.image_url;
            let members = item.members;
            let score = item.score;
            let continuing = item.continuing;
            let title = item.title;
            if (!score) score = "N/A";
            let url = item.url;
            let broadcast_day_time = item.broadcast.string;
            let day_time_array = broadcast_day_time.split(" ");
            let broadcast_weekday_int = weekdays_array.indexOf(day_time_array[0].slice(0, 3));
            let today_weekday_int = now.getDay() - 1 // Monday is 0
            let days_until_broadcast = (broadcast_weekday_int - today_weekday_int) % 7;
            let broadcast_date = new Date(new Date(Date().slice(0, 16) + day_time_array[2]).getTime() + (days_until_broadcast * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000));
            if (broadcast_day_time == "Unknown") broadcast_date = new Date(item.aired.from);
            while (Date.parse(Date()) > Date.parse(broadcast_date)) {
                broadcast_date.setTime(broadcast_date.getTime() + (7 * 24 * 60 * 60 * 1000)); // Add 7 days if it already aired today
            }
            if (item.status == "Not yet aired") broadcast_date = new Date(item.aired.from);
            // let start_date = new Date(airing_start);
            // let delta_days = ((start_date.getDay() + 7) - now.getDay()) % 7;
            // let next_air_date = now.addDays(delta_days);
            // next_air_date.setHours(start_date.getHours());
            // next_air_date.setMinutes(start_date.getMinutes());
            // next_air_date.setSeconds(start_date.getSeconds());
            // if (next_air_date < now) {
            //     next_air_date = next_air_date.addDays(7);
            // }
            // if (start_date > now) next_air_date = start_date;
            let seconds = Math.floor((broadcast_date.getTime() - now.getTime()) / 1000);
            if (item.status == "Finished Airing") seconds = -1;
            let series_arr = [title, seconds, members, score, image_url, url, continuing];
            compiled_series_arr.push(series_arr);
        });
    });
    return [page, compiled_series_arr];
};


function sort_func(sort_mode = last_mode) {
    let listingsArray = get_listings();
    if (listingsArray.length) {
        let sortedListings = listingsArray.sort(sort_mode);
        wrapper.innerHTML = "";
        sortedListings.forEach(e => wrapper.appendChild(e));
    }
    display_faves();
    last_mode = sort_mode;
};

let fave_toggle_display = () => {
    let fave_btn = document.getElementById("sort_faves");
    fave_btn.innerHTML = faves_toggle ? "&#10084;" : "&#128420;";
}

let toggle_faves = () => {
    faves_toggle = faves_toggle ? false : true
    fave_toggle_display();
    sort_func();
    $.cookie("faves_toggle", faves_toggle.toString(), { expires: 9999 });
};


let display_faves = () => {
    if (!faves_toggle) return;
    let listingsArray = get_listings();
    if (listingsArray.length) {
        wrapper.innerHTML = "";
        let prev_e = null;
        listingsArray.forEach(e => {
            if (faves.includes(e.firstChild.nextSibling.firstChild.firstChild.innerHTML)) {
                if (prev_e == null) {
                    wrapper.prepend(e);
                } else {
                    wrapper.insertBefore(e, prev_e.nextSibling);
                }
                prev_e = e;
            } else {
                wrapper.appendChild(e);
            }
        });
    }
};




function timer(element_id) {
    seconds = seconds_arr[element_id];
    var days = Math.floor(seconds / 24 / 60 / 60);
    var hoursLeft = Math.floor((seconds) - (days * 86400));
    var hours = Math.floor(hoursLeft / 3600);
    var minutesLeft = Math.floor((hoursLeft) - (hours * 3600));
    var minutes = Math.floor(minutesLeft / 60);
    var remainingSeconds = seconds % 60;
    function pad(n) {
        return (n < 10 ? "0" + n : n);
    }
    document.getElementById(element_id).innerHTML = pad(days) + " Days " + pad(hours) + " Hours " + pad(minutes) + " Minutes " + pad(remainingSeconds) + " Seconds";
    if (seconds == 0) {
        clearInterval(functions_arr[element_id]);
        document.getElementById(element_id).innerHTML = "Episode started airing";
    } else {
        seconds_arr[element_id]--;
    }
}




function populate_table(lastidx = 0, page = 1) {
    document.title = `${get_season_text().toUpperCase()} ${curr_year}`
    let [next_page, compiled_series_arr] = retrieve_season(curr_year, get_season_text(), page);
    compiled_series_arr.forEach((e, i) => {
        listing_div = document.createElement("div");
        listing_div.classList.add("listing");
        listing_div.setAttribute("data-countdown", e[1]);
        listing_div.setAttribute("data-popularity", e[2]);
        listing_div.setAttribute("data-score", e[3]);
        img_a = document.createElement("a");
        img_a.href = e[5];
        thumb_div = document.createElement("div");
        thumb_div.classList.add("thumb-div");
        thumb = document.createElement("img");
        thumb.classList.add("thumb");
        thumb.setAttribute("src", e[4]);
        img_a.appendChild(thumb);
        thumb_div.appendChild(img_a);
        listing_div.appendChild(thumb_div);
        title = document.createElement("a");
        title.classList.add("title");
        title.innerHTML = e[0];
        title.href = e[5];
        fave = document.createElement("span");
        fave.innerHTML = faves.includes(e[0]) ? "&#10084;" : "&#128420;";
        fave.classList.add("fave");
        headdiv = document.createElement("div");
        headdiv.appendChild(title);
        headdiv.appendChild(fave);
        text_block_div = document.createElement("div");
        text_block_div.classList.add("text-block-div");
        text_block_div.appendChild(headdiv);
        span1 = document.createElement("span");
        span1.classList.add("lead");
        span1.innerHTML = "&#128293 " + e[2] + " ";
        span2 = document.createElement("span");
        span2.classList.add("lead");
        span2.innerHTML = "&#11088 " + e[3] + " ";
        span3 = document.createElement("span");
        span3.classList.add("lead");
        span3.innerHTML = "00 Days 00 Hours 00 Minutes 00 Seconds";
        span3.setAttribute("id", lastidx + i);
        text_block_div.appendChild(span1);
        text_block_div.appendChild(span2);
        watch_btn = document.createElement("a");
        watch_btn.style.display = "inline-block";
        watch_btn.href = WATCH_DOMAIN + e[0];
        watch_btn.target = "_blank";
        watch_btn.innerHTML = `<img style="height:20px;" src="https://gogoanime.wiki/img/icon/logo.png"><br>`;
        watch_btn2 = document.createElement("a");
        watch_btn2.href = WATCH_DOMAIN2 + e[0];
        watch_btn2.target = "_blank";
        watch_btn2.innerHTML = `<img style="height:20px;padding-left:5px;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAU8AAABcCAYAAADu+DdzAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGuGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDYgNzkuMTY0NzUzLCAyMDIxLzAyLzE1LTExOjUyOjEzICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMyAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjItMDYtMzBUMTU6NDE6MjQrMDc6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIyLTA3LTIzVDE0OjUxOjA0KzA3OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIyLTA3LTIzVDE0OjUxOjA0KzA3OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmViOTE1N2ZjLTQ4YWUtNGUxZC1hMDA2LTA2YWIzZWYzZWI5NyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowNTMxMTZiNi1lNjI2LTQwNTUtODhkYy00ZjA1MDM4YjU2YjciIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowNTMxMTZiNi1lNjI2LTQwNTUtODhkYy00ZjA1MDM4YjU2YjciPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjA1MzExNmI2LWU2MjYtNDA1NS04OGRjLTRmMDUwMzhiNTZiNyIgc3RFdnQ6d2hlbj0iMjAyMi0wNi0zMFQxNTo0MToyNCswNzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjMgKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjg4ZGQ1YTc4LWE4NTAtNDQ3MS04N2Y3LWM1OWViOWJkYTQ2NCIgc3RFdnQ6d2hlbj0iMjAyMi0wNy0yM1QxMzoyNDowNiswNzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjMgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmViOTE1N2ZjLTQ4YWUtNGUxZC1hMDA2LTA2YWIzZWYzZWI5NyIgc3RFdnQ6d2hlbj0iMjAyMi0wNy0yM1QxNDo1MTowNCswNzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjMgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+BDDmoQAANjhJREFUeJztXXd8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"><br>`;
        text_block_div.appendChild(watch_btn);
        text_block_div.appendChild(watch_btn2);
        text_block_div.appendChild(span3);
        listing_div.appendChild(text_block_div);
        wrapper.appendChild(listing_div);
        seconds_arr.push(e[1]);
        if (e[1] == -1) {
            // listing_div.setAttribute("data-countdown", 10 ** 10);
            span3.innerHTML = "";
        } else {
            let countdownTimer = setInterval(() => {
                timer(lastidx + i);
            }, 1000);
            functions_arr.push(countdownTimer);
        }
    });
    if (next_page != -1) populate_table(lastidx+compiled_series_arr.length, next_page);
    // if (compiled_series_arr.length == 0) {
    //     alert("No more data!");
    // }
    $(".loader").hide()
    sort_func();
}

$.ajaxSetup({
    async: false
});
populate_table();


function reset_page() {
    // $(".loader").show()
    $("#wrapper").empty();
    // functions_arr.forEach(element => {
    // clearInterval(element);
    // });
    for (var i = 1; i < 99999; i++)
        window.clearInterval(i);
    functions_arr = [];
    seconds_arr = [];
}

$("#next-btn").on("click", function () {
    reset_page()
    curr_season += 1;
    if (get_season_text() == "winter") curr_year += 1;
    populate_table();
    window.scrollTo({ top: 0, behavior: 'smooth' });

})

$("#prev-btn").on("click", function () {
    reset_page()
    curr_season -= 1;
    if (get_season_text() == "fall") curr_year -= 1;
    populate_table();
    window.scrollTo({ top: 0, behavior: 'smooth' });

})

$("#curr-btn").on("click", function () {
    reset_page()
    curr_season = getSeason(now);
    curr_year = now.getFullYear();
    populate_table();
    window.scrollTo({ top: 0, behavior: 'smooth' });

})


$(document).on("click", ".fave", event => {
    let title = $(event.target).prev().html();
    let heart = $(event.target);
    if (faves.includes(title)) {
        let index = faves.indexOf(title);
        // Remove from faves
        if (index > -1) {
            faves.splice(index, 1);
            heart.html("&#128420;");
        }
    } else {
        faves.push(title);
        heart.html("&#10084;");
    }
    $.cookie("faves", JSON.stringify(faves), { expires: 9999 });
    sort_func();
});


let search_function = () => {
    let search_box = document.getElementById("search_box");
    let query = search_box.value.toUpperCase();
    let listingsArray = get_listings();
    listingsArray.forEach(e => {
        title = e.firstChild.nextSibling.firstChild.firstChild.innerHTML;
        if (title.toUpperCase().includes(query)) {
            e.style.display = "block";
        } else {
            e.style.display = "none";
        }
    });
};

document.addEventListener("DOMContentLoaded", function () {
    fave_toggle_display();
    toggle_search_box();
    el_autohide = document.querySelector(".autohide");
    navbar_height = document.querySelector(".navbar").offsetHeight;
    document.body.style.paddingTop = navbar_height + "px";
    if (el_autohide) {
        var last_scroll_top = 0;
        window.addEventListener("scroll", function () {
            let scroll_top = window.scrollY;
            if (scroll_top < last_scroll_top) {
                el_autohide.classList.remove("scrolled-down");
                el_autohide.classList.add("scrolled-up");
            }
            else {
                el_autohide.classList.remove("scrolled-up");
                el_autohide.classList.add("scrolled-down");
            }
            last_scroll_top = scroll_top;
        });
    }
    document.getElementById("sort_soonest").onclick = () => {
        sort_func(soonest_sort);
    };

    document.getElementById("sort_most_recent").onclick = () => {
        sort_func(recent_sort);
    };

    document.getElementById("sort_highest_score").onclick = () => {
        sort_func(score_sort);
    };

    document.getElementById("sort_popular").onclick = () => {
        sort_func(pop_sort);
    };

    document.getElementById("sort_faves").onclick = () => {
        toggle_faves();
    };
});


let search_box = document.createElement("input");
let navbar_div = document.getElementById("navbar-div");
search_box.classList.add("form-control-sm");
search_box.style.border = 0;
search_box.style.background = "none";
search_box.id = "search_box";
search_box.onkeyup = search_function;
search_box.type = "text";
search_box.placeholder = "Search";
navbar_div.appendChild(search_box);

function toggle_search_box() {
    let navbar = document.getElementById("nav");
    let search_box = document.getElementById("search_box");
    if (navbar.offsetWidth > 700) {
        search_box.style.display = "inline";
    } else {
        search_box.style.display = "none";
    }
}

let $search = $("#search_box");
$(document).on("keydown", function (e) {
    if (!$search.is(":focus"))
        if (e.which != 9 && e.which != 13)
            $search.focus();
    if (e.which == 27)
        $search.val("");
});

window.addEventListener("resize", function (event) {
    toggle_search_box();
});
