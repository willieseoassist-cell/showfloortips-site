/**
 * ShowFloorTips - Upcoming Trade Shows Widget
 * Embed: <div id="sft-widget" data-category="technology" data-count="5"></div>
 *        <script src="https://showfloortips.com/embed/widget.js"></script>
 * Size: <10KB | No dependencies | Self-contained styles
 */
(function() {
    'use strict';

    var BASE = 'https://showfloortips.com';
    var API = BASE + '/api/shows-widget';
    var container = document.getElementById('sft-widget');
    if (!container) return;

    var category = container.getAttribute('data-category') || 'all';
    var count = parseInt(container.getAttribute('data-count')) || 5;
    var theme = container.getAttribute('data-theme') || 'light';

    // Clamp count
    if (count < 1) count = 1;
    if (count > 20) count = 20;

    // Colors
    var C = theme === 'dark' ? {
        bg: '#1a1a1a', card: '#242424', border: '#333', text: '#e5e5e5',
        sub: '#999', accent: '#60a5fa', hover: '#2a2a2a', foot: '#666',
        footBg: '#151515', badge: '#2a2a2a', badgeText: '#aaa', skeleton: '#2a2a2a'
    } : {
        bg: '#fff', card: '#fff', border: '#e5e5e5', text: '#0a0a0a',
        sub: '#737373', accent: '#0a0a0a', hover: '#fafafa', foot: '#a3a3a3',
        footBg: '#fafafa', badge: '#f5f5f5', badgeText: '#737373', skeleton: '#f0f0f0'
    };

    // Inject shadow DOM for style isolation
    var shadow, root;
    if (container.attachShadow) {
        shadow = container.attachShadow({ mode: 'open' });
        root = shadow;
    } else {
        root = container;
    }

    // Styles
    var style = document.createElement('style');
    style.textContent = [
        ':host{display:block;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.5}',
        '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}',
        '.sft-w{background:' + C.bg + ';border:1px solid ' + C.border + ';border-radius:12px;overflow:hidden;max-width:400px;width:100%}',
        '.sft-wh{padding:16px 18px 12px;border-bottom:1px solid ' + C.border + '}',
        '.sft-wh h3{font-size:15px;font-weight:700;color:' + C.text + ';letter-spacing:-0.01em;margin:0}',
        '.sft-wh p{font-size:11px;color:' + C.sub + ';margin-top:2px;text-transform:uppercase;letter-spacing:0.5px;font-weight:500}',
        '.sft-wl{list-style:none;padding:0;margin:0}',
        '.sft-wi{padding:12px 18px;border-bottom:1px solid ' + C.border + ';transition:background .15s;cursor:pointer;text-decoration:none;display:block;color:inherit}',
        '.sft-wi:last-child{border-bottom:none}',
        '.sft-wi:hover{background:' + C.hover + '}',
        '.sft-wt{font-size:13px;font-weight:600;color:' + C.text + ';line-height:1.35;margin-bottom:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
        '.sft-wm{display:flex;align-items:center;gap:12px;font-size:11px;color:' + C.sub + '}',
        '.sft-wm span{display:flex;align-items:center;gap:3px;white-space:nowrap}',
        '.sft-wm svg{flex-shrink:0}',
        '.sft-wb{display:inline-block;font-size:10px;font-weight:600;color:' + C.badgeText + ';background:' + C.badge + ';padding:2px 7px;border-radius:4px;margin-top:4px;text-transform:uppercase;letter-spacing:0.3px}',
        '.sft-wf{padding:10px 18px;background:' + C.footBg + ';border-top:1px solid ' + C.border + ';text-align:center}',
        '.sft-wf a{font-size:11px;color:' + C.foot + ';text-decoration:none;font-weight:500;transition:color .15s}',
        '.sft-wf a:hover{color:' + C.text + '}',
        '.sft-sk{padding:12px 18px;border-bottom:1px solid ' + C.border + '}',
        '.sft-sk-t{height:14px;background:' + C.skeleton + ';border-radius:4px;margin-bottom:6px;width:75%;animation:sftPulse 1.5s ease-in-out infinite}',
        '.sft-sk-m{height:10px;background:' + C.skeleton + ';border-radius:4px;width:50%;animation:sftPulse 1.5s ease-in-out infinite;animation-delay:.2s}',
        '@keyframes sftPulse{0%,100%{opacity:1}50%{opacity:.5}}',
        '.sft-empty{padding:24px 18px;text-align:center;font-size:13px;color:' + C.sub + '}',
        '@media(max-width:480px){.sft-w{border-radius:8px}.sft-wh{padding:14px 14px 10px}.sft-wi{padding:10px 14px}.sft-wf{padding:8px 14px}}'
    ].join('\n');
    root.appendChild(style);

    // Wrapper
    var wrap = document.createElement('div');
    wrap.className = 'sft-w';
    wrap.setAttribute('role', 'complementary');
    wrap.setAttribute('aria-label', 'Upcoming Trade Shows');

    // Header
    var hdr = document.createElement('div');
    hdr.className = 'sft-wh';
    hdr.innerHTML = '<h3>Upcoming Trade Shows</h3>' +
        (category !== 'all' ? '<p>' + escHtml(category) + '</p>' : '<p>All Industries</p>');
    wrap.appendChild(hdr);

    // Skeleton loading
    var list = document.createElement('div');
    list.className = 'sft-wl';
    list.setAttribute('role', 'list');
    for (var i = 0; i < Math.min(count, 5); i++) {
        list.innerHTML += '<div class="sft-sk"><div class="sft-sk-t"></div><div class="sft-sk-m"></div></div>';
    }
    wrap.appendChild(list);

    // Footer
    var foot = document.createElement('div');
    foot.className = 'sft-wf';
    foot.innerHTML = '<a href="' + BASE + '/?ref=widget" target="_blank" rel="noopener">Powered by ShowFloorTips.com</a>';
    wrap.appendChild(foot);

    root.appendChild(wrap);

    // Fetch data
    var url = API + '?count=' + count + '&category=' + encodeURIComponent(category);
    fetchJSON(url, function(err, data) {
        if (err || !data || !data.shows) {
            list.innerHTML = '<div class="sft-empty">Unable to load trade shows.</div>';
            return;
        }

        if (data.shows.length === 0) {
            list.innerHTML = '<div class="sft-empty">No upcoming shows found' +
                (category !== 'all' ? ' for ' + escHtml(category) : '') + '.</div>';
            return;
        }

        var html = '';
        for (var j = 0; j < data.shows.length; j++) {
            var s = data.shows[j];
            var loc = [s.ci, s.co].filter(Boolean).join(', ');
            html += '<a class="sft-wi" href="' + BASE + '/shows/' + s.s + '?ref=widget" target="_blank" rel="noopener" role="listitem">' +
                '<div class="sft-wt">' + escHtml(s.t) + '</div>' +
                '<div class="sft-wm">' +
                    '<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="' + C.sub + '" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' + escHtml(s.d) + '</span>' +
                    (loc ? '<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="' + C.sub + '" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' + escHtml(loc) + '</span>' : '') +
                '</div>' +
                (s.ca ? '<div class="sft-wb">' + escHtml(s.ca) + '</div>' : '') +
            '</a>';
        }
        list.innerHTML = html;
    });

    // Helpers
    function escHtml(str) {
        if (!str) return '';
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(str));
        return d.innerHTML;
    }

    function fetchJSON(u, cb) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', u, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try { cb(null, JSON.parse(xhr.responseText)); }
                    catch (e) { cb(e); }
                } else {
                    cb(new Error('HTTP ' + xhr.status));
                }
            }
        };
        xhr.send();
    }
})();
