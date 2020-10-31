const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const app = express();
const bodyParser = require("body-parser");
const request = require("request");
const urlencode = require("urlencode");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/naver", async (req, res) => {
  const { data } = await axios.get("https://comic.naver.com/index.nhn");
  const naverwebtoonHtml = cheerio.load(data);
  const naverRecom = naverwebtoonHtml("div.genreRecomBox_area ul.genreRecom")
    .children()
    .toArray()
    .slice(0, 3);

  console.log(naverRecom);
  const webtoonlist = [];

  for (const recom of naverRecom) {
    const recominfo = naverwebtoonHtml(recom);
    const toonlist = recominfo.children("ul").children().toArray();

    for (const toon of toonlist) {
      const tooninfo = naverwebtoonHtml(toon);
      const image = tooninfo.find(".genreRecomImg img").attr("src");
      const title = tooninfo.find(".title a").text();
      const url =
        "https://comic.naver.com" + tooninfo.find(".title a").attr("href");
      webtoonlist.push({
        title,
        image,
        url,
      });
    }
  }
  res.status(200).json({ webtoonlist });
});

app.get("/daum", async (req, res) => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  await page.goto("http://webtoon.daum.net/ranking");

  const lists = await page.$$(
    "#serialRanking ol.list_ranking.list_ranking1 li"
  );

  const webtoonlist = [];
  for (const list of lists) {
    const info = await list.evaluate((node) => {
      return {
        title: node.querySelector("strong").textContent,
        image: node.querySelector("img").src,
        url: node.querySelector("a").href,
      };
    });
    webtoonlist.push(info);
  }

  browser.close();

  res.status(200).json({ webtoonlist });
});

app.get("/kakao", async (req, res) => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  await page.goto("https://page.kakao.com/main?categoryUid=10");

  const html = await page.$$("div.css-19y0ur2 a");
  const webtoonlist = [];
  for (const list of html) {
    const info = await list.evaluate((node) => {
      return {
        title: node.querySelector("div.css-fe9s02").textContent,
        image: node.querySelector("div.css-1godi3z img").src,
        url: node.href,
      };
    });
    webtoonlist.push(info);
    // console.log(info);
  }
  browser.close();
  res.status(200).json({ webtoonlist });
});

app.post("/search", async (req, res) => {
  const { search, selectSite } = req.body;
  const siteList = [
    {
      url: "https://comic.naver.com/search.nhn?keyword=",
      value: 1,
    },
  ];
  const site = siteList.find((s) => s.value === selectSite);

  const { data } = await axios.get(`${site.url}${urlencode(search)}`);
  const naverwebtoonHtml = cheerio.load(data);

  const searchResult = naverwebtoonHtml("div.resultBox .resultList li").first();

  const webToonURL = searchResult.find("h5 a").attr("href");
  console.log(webToonURL);

  res.status(200).json({
    url: `https://comic.naver.com${webToonURL}`,
  });
});

app.listen(8080, () => {
  console.log("oi is start");
});

//test commit
