const DOMAIN = "https://api.jikan.moe/v3/season";
const now = new Date();

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}


function retrieve_season(year, season) {
    let season_url = `${DOMAIN}/${year}/${season}`;
    let compiled_series_arr = [];
    $.getJSON(season_url, function (data) {
        $.each(data.anime, function (i, item) {
            let airing_start = item.airing_start;
            let image_url = item.image_url;
            let members = item.members;
            let score = item.score;
            let title = item.title;
            let url = item.url;
            console.log(title);
            console.log(airing_start);
            let start_date = new Date(airing_start);
            let delta_days = ((start_date.getDay() + 7) - now.getDay()) % 7;
            let next_air_date = now.addDays(delta_days);
            next_air_date.setHours(start_date.getHours());
            next_air_date.setMinutes(start_date.getMinutes());
            next_air_date.setSeconds(start_date.getSeconds());
            if (next_air_date < now) {
                next_air_date = next_air_date.addDays(7);
            }
            console.log(next_air_date);
            console.log(next_air_date.getTime() - now.getTime());
            if (start_date > now) next_air_date = start_date;
            let seconds = Math.floor((next_air_date.getTime() - now.getTime()) / 1000);
            let series_arr = [title, seconds, members, score, image_url, url];
            compiled_series_arr.push(series_arr);
        });
    });
    return compiled_series_arr;
};


let sort_func = algo => {
    let listingsArray = get_listings();
    if (listingsArray.length) {
        let sortedListings = listingsArray.sort(algo);
        wrapper.innerHTML = "";
        sortedListings.forEach(e => wrapper.appendChild(e));
    }
    if (faves_toggle == true) {
        sort_faves_func();
    }
    last_mode = algo;
};

let get_listings = () => {
    let listings = document.querySelectorAll("[data-countdown]");
    let listingsArray = Array.from(listings);
    return listingsArray;
};
let soonest_sort = (a, b) => {
    return (a.dataset.countdown - b.dataset.countdown)
};
let pop_sort = (a, b) => {
    return (b.dataset.popularity - a.dataset.popularity)
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


let toggle_faves = () => {
    let fave_btn = document.getElementById("sort_faves");
    if (document.title == "Loading...") {
        return;
    }
    if (faves_toggle == false) {
        fave_btn.innerHTML = "&#10084;";
        sort_faves_func();
        faves_toggle = true;
    } else {
        fave_btn.innerHTML = "&#128420;";
        faves_toggle = false;
        sort_func(last_mode);
    }
    $.cookie("faves_toggle", faves_toggle.toString(), { expires: 9999 });
};


let sort_faves_func = () => {
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
let sort_toggle_func = () => {
    if (faves_toggle == false) {
        sort_func(last_mode);
    } else {
        sort_func(last_mode);
        sort_faves_func();
    }
};


let faves = [];
var remain_faves_toggle;
var seconds_arr = [];
var functions_arr = [];
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


// current_season = body.pop();
// document.title = current_season;
// prev_season_url = body.pop();
// next_season_url = body.pop();
// prev = document.getElementById("prev");
// next = document.getElementById("next");
// prev.value = prev_season_url;
// next.value = next_season_url;

let faves_cookie = $.cookie("faves");
if (faves_cookie == null) {
    $.cookie("faves", JSON.stringify(faves), { expires: 9999 });
} else {
    faves = JSON.parse($.cookie("faves"));
}

var wrapper = document.getElementById("wrapper");
$.ajaxSetup({
    async: false
});
let compiled_series_arr = retrieve_season("2021", "fall")
compiled_series_arr.forEach((e, i) => {
    listing_div = document.createElement("div");
    listing_div.classList.add("mt-3");
    listing_div.classList.add("mb-3");
    listing_div.classList.add("listing");
    listing_div.style.borderRadius = "3px";
    listing_div.setAttribute("data-countdown", e[1]);
    listing_div.setAttribute("data-popularity", e[2]);
    listing_div.setAttribute("data-score", e[3]);
    img_a = document.createElement("a");
    img_a.href = e[5];
    thumb_div = document.createElement("div");
    thumb_div.style.height = "185px";
    thumb_div.style.width = "140px";
    thumb = document.createElement("img");
    thumb.setAttribute("src", e[4]);
    thumb.style.maxHeight = "100%";
    thumb.style.width = "100%";
    thumb.style.position = "relative";
    thumb.style.top = "50%";
    thumb.style.transform = "translateY(-50%)";
    img_a.appendChild(thumb);
    thumb_div.appendChild(img_a);
    thumb_div.classList.add("d-inline-block");
    listing_div.appendChild(thumb_div);
    title = document.createElement("a");
    title.innerHTML = e[0];
    title.style.maxWidth = "calc(100% - 44px)";
    title.style.textDecoration = "none";
    title.style.color = "inherit";
    title.href = e[5];
    title.classList.add("d-inline-block");
    title.classList.add("h2");
    fave = document.createElement("h2");
    if (faves.includes(e[0])) {
        fave.innerHTML = "&#10084;";
    } else {
        fave.innerHTML = "&#128420;";
    }
    fave.classList.add("fave");
    fave.classList.add("d-inline-block");
    fave.style.float = "right";
    headdiv = document.createElement("div");
    headdiv.appendChild(title);
    headdiv.appendChild(fave);
    text_block_div = document.createElement("div");
    text_block_div.classList.add("d-inline-block");
    text_block_div.style.verticalAlign = "middle";
    text_block_div.style.paddingLeft = "20px";
    text_block_div.style.width = "calc(100% - 160px)";
    text_block_div.appendChild(headdiv);
    span1 = document.createElement("span");
    span1.classList.add("lead");
    span1.innerHTML = "&#128293 " + e[2] + " ";
    span2 = document.createElement("span");
    span2.classList.add("lead");
    span2.innerHTML = "&#11088 " + e[3] + "<br>";
    span3 = document.createElement("span");
    span3.classList.add("lead");
    span3.innerHTML = "00 Days 00 Hours 00 Minutes 00 Seconds";
    span3.setAttribute("id", i);
    text_block_div.appendChild(span1);
    text_block_div.appendChild(span2);
    text_block_div.appendChild(span3);
    listing_div.appendChild(text_block_div);
    listing_div.style.width = "100%";
    listing_div.style.margin = "0 auto";
    listing_div.style.overflow = "hidden";
    wrapper.appendChild(listing_div);
    seconds_arr.push(e[1]);
    var countdownTimer = setInterval(() => {
        timer(i);
    }, 1000);
    functions_arr.push(countdownTimer);
});
$.ajaxSetup({
    async: true
});


let fave_toggle_cookie = $.cookie("faves_toggle");
if (fave_toggle_cookie == null) {
    $.cookie("faves_toggle", "false", { expires: 9999 });
}
remain_faves_toggle = ($.cookie("faves_toggle") === "true");
sort_func(soonest_sort); // default sort when first loading page
if (remain_faves_toggle) {
    toggle_faves();
}
$(".fave").on("click", event => {
    var fave = $(event.target).prev().html();
    var heart = $(event.target);
    if (faves.includes(fave)) {
        let index = faves.indexOf(fave);
        if (index > -1) {
            faves.splice(index, 1);
            heart.html("&#128420;");
        }
    } else {
        faves.push(fave);
        heart.html("&#10084;");
    }
    sort_toggle_func();
    if (faves_toggle == true) {
        sort_faves_func();
    }
    $.cookie("faves", JSON.stringify(faves), { expires: 9999 });
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

    hideSearch();
});
window.addEventListener("resize", function (event) {
    hideSearch();
});
function hideSearch() {
    let bu = document.getElementById("buttons");
    let nav = document.getElementById("nav");
    let search_box = document.createElement("input");
    search_box.classList.add("form-control-sm");
    search_box.style.border = 0;
    search_box.style.background = "none";
    search_box.id = "search_box";
    search_box.onkeyup = search_function;
    search_box.type = "text";
    search_box.placeholder = "Search";
    let real_box = document.getElementById("search_box");
    if (nav.offsetWidth > 700) {
        if (!real_box) {
            bu.appendChild(search_box);
        }
        else {
            real_box.style.display = "inline";
        }
    } else if (real_box) {
        real_box.style.display = "none";
    }
}

var faves_toggle = false;
var last_mode = null;

$(document).ready(function () {
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
