const axios = require('axios').default;
const fs = require('fs').promises;
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const j2c = require('json2csv').Parser;
const utilityApps = [];
const securityApps = [];

const getLastUpdateAndDownloads = async (url, userAgent) => {
    const responce = await axios.get(url, {
        headers: {
            'User-Agent': userAgent
        }
    });
    const appBody = responce.data;
    $ = cheerio.load(appBody);
    const lastUpdate = $('.c-productDetails_body')
    .children('ul')
    .children('li:nth-child(2)')
    .text()
    .split(' ')
    .pop();
    const downloads = $('span:contains("Downloads Last Week")')
    .parent()
    .children('span:nth-child(2)')
    .text();
    return { lastUpdate, downloads };
};

const getApps = async (url, apps) => {
    const urlBase = 'https://download.cnet.com';
    const userAgent = randomUseragent.getRandom();
    const responce = await axios.get(url, {
        headers: {
            'User-Agent': userAgent
        }
    });
    const $ = cheerio.load(responce.data);
    $('.c-productCard_link')
    .each(async function () {
        const link = urlBase + $(this).attr('href');
        const name = $(this).text().trim();
        const {lastUpdate, downloads} = await getLastUpdateAndDownloads(link, userAgent);
        const app = {
            name,
            lastUpdate,
            link,
            downloads
        };
        apps.push(app);
    })
}

const main = async () => {
    try {
        const url1 = 'https://download.cnet.com/utilities/windows/?sort=mostPopular&price=free';
        const url2 = 'https://download.cnet.com/security/windows/?sort=mostPopular&price=free' 
             
        await getApps(url1, utilityApps);
        await getApps(url2, securityApps);
        setTimeout( () => {
            const parser = new j2c();
            const utilityCsv = parser.parse(utilityApps);
            const securityCsv = parser.parse(securityApps);
            fs.writeFile('utilityApps.csv', utilityCsv);
            fs.writeFile('securityApps.csv', securityCsv);
        }, 6 * 1000);
        } catch (err) { console.log('Error: ', err) }
}

main();