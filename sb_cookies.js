const Nightmare = require('nightmare');
const _ = require('lodash');
const util = require('util');
const config = require('./config.json');

Array.prototype._cookieMapping = function(mapArray) {
    let resultString = '';
    for (let i = 0; i < this.length; i++) {
        for (let j = 0; j < mapArray.length; j++) {
            if (this[i].domain === mapArray[j].domain && (mapArray[j].names === '-all' || mapArray[j].names.indexOf(this[i].name) > -1)) {
                resultString += `${this[i].name}=${this[i].value}; `;
            }
        }
    }

    return resultString;
};

Nightmare.action('clearCache',
    function (name, options, parent, win, renderer, done) {
        parent.respondTo('clearCache', function (done) {
            win.webContents.session.clearCache(done);
            done();

        });
        done();
    },
    function (done) {
        this.child.call('clearCache', done);
    });

(() => {
    let args = process.argv.splice(2);

    let link = null;
    let proxy = config.proxy;
    switch (args.length) {
        case 1:
            link = args[0];
            break;
        case 2:
            link = args[0];
            proxy = args[1];
            break;
    }

    //--------TEST MODE--------
    link = 'https://api.nike.com/deliver/available_skus/v1/?filter=productIds(c7b989ab-5965-5aaa-a66e-20145ba594bc)';

    openBrowser(link, proxy);
})();

function openBrowser(link, proxy) {
    let checkoutBrowser = Nightmare({
            show: config.show,
            alwaysOnTop: config.alwaysOnTop,
            switches: proxy ? {
                'proxy-server': proxy.hostPort,
                'ignore-certificate-errors': false
            } : {},
            webPreferences: {
                webSecurity: false
            }
        }).useragent(config.userAgent)
        .cookies.clearAll()
        .clearCache();

    setTimeout(() => {
        checkoutBrowser
            .authentication(proxy ? proxy.login : null, proxy ? proxy.password : null)
            .goto(link)
            .cookies.get()
            .end()
            .then((cookies) => {
                console.log(cookies._cookieMapping(config.mapArray));
                //--------TEST MODE--------
                console.log(util.inspect(cookies));
            }).catch((error) => {
                console.error(util.inspect(error));
            });
    }, 1000);
}