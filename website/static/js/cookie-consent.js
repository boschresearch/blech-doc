// Locally saved from https://github.com/js-cookie/js-cookie/blob/latest/src/js.cookie.js
// JavaScript Cookie v2.2.1 (latest stable version)
import("/js/js.cookie.js");

// Get cookie consent if the UTC time zone is within the EU+ and user has not consented previously (no cookie exists)
// Wait for page to fully load before checking
$(window).on('load', setprivacy);

function setprivacy() {
    console.log("on load started");
    // If the cookie expired or does not exist
    if ( typeof(Cookies) == 'undefined' || Cookies.get('site_cookie') == null ){
        $(".cookienotice").show();
    } else {
        console.log("You have already decided on privacy");
        if (Cookies.get('opt_in')) {
            console.log("Optin consented");
            loadGAonConsent();
        }
    }    
}

// Consent to Google Analytics usage (OK' in cookie notice). Sets expiration to 1 year.
function acceptcookie(){
    $(".cookienotice").hide();
    // set cookie that expires in 12 mns
    Cookies.set('opt_in', 'accepted', { expires: 365});
    Cookies.set('site_cookie', 'accepted', { expires: 365 });
    loadGAonConsent();
    console.log("I consent to use of google analytics");
}

// Hide cookie notice and and deny use of Google Analytics
function closenotice(){
    $(".cookienotice").hide();
    // set cookie that expires in 12 mns
    Cookies.set('site_cookie', 'accepted', { expires: 1 });
    console.log("I deny the use of google analytics for 1 day");
}


// Manually check if the 'site_cookie' exists
function getcookie(){
    return Cookies.get('site_cookie');
}

function loadGAonConsent(){
    window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
    ga('create', 'UA-163758392-1', 'auto');
    ga('set', 'anonymizeIp', true);
    ga('send', 'pageview');
    var gascript = document.createElement("script");
    gascript.async = true;
    gascript.src = "https://www.google-analytics.com/analytics.js";
    document.getElementsByTagName("head")[0].appendChild(gascript, document.getElementsByTagName("head")[0]);               
}
   