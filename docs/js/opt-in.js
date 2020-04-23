import("/js/js.cookie.js");

// Wait for page to fully load before checking
$(window).on('load', setPrivacy);

// Show Google Analytics Opt-in notice, if not decided before
function setPrivacy() {
    console.log("on load started");
    // If the cookie expired or does not exist
    if (doNoTrack()) {
        console.log ("Do not show opt-in notice, do not load GA")
    }
    else {
        if ( typeof(Cookies) == 'undefined' || Cookies.get('site_cookie') == null ){
            console.log("Show opt-in notice")
            $(".analytics-opt-in").show();
        } else {
            console.log("Already decided on analytics usage");
            if (Cookies.get('opt_in')) {
                console.log("Optin consented");
                loadGAonOptIn();
            }
        }
    }    
}

// Opt-in to Google Analytics usage for 1 year
function optIn(){
    $(".analytics-opt-in").hide();
    // set cookie that expires in 12 mns
    Cookies.set('opt_in', 'accepted', { expires: 365});
    Cookies.set('site_cookie', 'accepted', { expires: 365 });
    loadGAonConsent();
    console.log("Opt-in to google analytics usage for one year");
}

// Hide opt-in notice and and deny Google Analytics usage for 4 weeks
function closeNotice(){
    $(".analytics-opt-in").hide();
    Cookies.set('site_cookie', 'accepted', { expires: 28 });
    console.log("Deny google analytics usage for 4 weeks");
}


function doNoTrack() {
    var dnt = (navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack);
    var res = dnt == "1" || dnt == "yes";
    console.log(res)
    return res
}

function loadGAonOptIn(){
    window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
    ga('create', 'UA-163758392-1', 'auto');
    ga('set', 'anonymizeIp', true);
    ga('send', 'pageview');
    var gascript = document.createElement("script");
    gascript.async = true;
    gascript.src = "https://www.google-analytics.com/analytics.js";
    document.getElementsByTagName("head")[0].appendChild(gascript, document.getElementsByTagName("head")[0]);
}
    