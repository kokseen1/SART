const DOMAIN = "https://api.jikan.moe/v4/seasons";
const WATCH_DOMAIN = "https://gogoanime.gg//search.html?keyword=";
const WATCH_DOMAIN2 = "https://9anime.to/search?keyword=";
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
        watch_btn.innerHTML = `<img style="height:20px;padding-bottom:5px;" src="https://gogoanime.wiki/img/icon/logo.png"><br>`;
        watch_btn2 = document.createElement("a");
        watch_btn2.href = WATCH_DOMAIN2 + e[0];
        watch_btn2.target = "_blank";
        watch_btn2.innerHTML = `<img style="height:20px;padding-bottom:5px;" src="https://9anime.vc/images/logo.png"><br>`;
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
