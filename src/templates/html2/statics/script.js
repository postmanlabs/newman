/* global document, window, markdown */
document.addEventListener('DOMContentLoaded', function() {
    var descriptions = document.querySelectorAll('.description');

    Array.prototype.forEach.call(descriptions, function (el) {
        el.innerHTML = markdown.toHTML(el.textContent);
    });

    var nav = document.querySelectorAll('a.tab-navigation');

    Array.prototype.forEach.call(nav, function (el) {
        el.addEventListener('click', onClick);
    });

    function onClick (e) {
        var link, id;
        e.preventDefault();
        window.scrollTo(0, 0);

        if (e.target.nodeName === "SPAN") {
            link = e.target.parentNode;
        } else if (e.target.nodeName === "A") {
            link = e.target;
        }

        id = link.getAttribute('href').slice(1);
        document.querySelector('a.current').classList.remove('current');
        document.querySelector('a[href="#'+id+'"]').classList.add('current');
        document.querySelector('div.data-tab-active').classList.remove('data-tab-active');
        document.querySelector('div[id="'+id+'"]').classList.add('data-tab-active');
        document.querySelector('a.page-title').textContent = document.querySelector('div[id="'+id+'"]').getAttribute('data-name');
    }
});