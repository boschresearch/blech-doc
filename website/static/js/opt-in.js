// Locally saved from https://github.com/js-cookie/js-cookie/blob/latest/src/js.cookie.js
// JavaScript Cookie v2.2.1 (latest stable version)
import("/js/js.cookie.js");

// Wait for page to fully load before checking
$(window).on('load', setprivacy);

// Show Google Analytics Opt-in notice, if not decided before
function setprivacy() {
    console.log("on load started");
    // If the cookie expired or does not exist
    if ( typeof(Cookies) == 'undefined' || Cookies.get('site_cookie') == null ){
        $(".analytics-opt-in").show();
    } else {
        console.log("Already decided on analytics usage");
        if (Cookies.get('opt_in')) {
            console.log("Optin consented");
            loadGAonOptIn();
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


// Respect do not track
// Anonymize IP
// Use cookies, not session or local storage
function loadGAonOptIn(){
    var dnt = (navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack);
    var doNotTrack = (dnt == "1" || dnt == "yes");
    if (!doNotTrack) {
        window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
        ga('create', 'UA-163758392-1', 'auto');
	    ga('set', 'anonymizeIp', true);
        ga('send', 'pageview');
        var gascript = document.createElement("script");
        gascript.async = true;
        gascript.src = "https://www.google-analytics.com/analytics.js";
        document.getElementsByTagName("head")[0].appendChild(gascript, document.getElementsByTagName("head")[0]);
    }
}
   