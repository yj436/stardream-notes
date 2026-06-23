# Content Sources

Last reviewed: 2026-06-23

This project uses original Chinese summaries based on public pages. Local image assets are limited to Creative Commons, public-domain, or clearly reusable source files. Commercial anime posters, game screenshots, and official key visuals should be linked or attributed with explicit rights information before being stored locally.

## Article Sources

| Post | Main sources | Notes |
| --- | --- | --- |
| 2026 春季番剧前哨：AnimeJapan 公共日与 AJ Stage 看点整理 | [AnimeJapan 2026 About](https://anime-japan.jp/en/about/) | Uses official date, venue, and program categories as the anime-section anchor. |
| Comiket COS 图廊：从角色扮演区看同人现场氛围 | [Comic Market official English site](https://www.comiket.co.jp/index_e.html), [overseas attendee information](https://www.comiket.co.jp/info-a/TAFO/) | Original summary for the cosplay/gallery section. |
| Tokyo Game Show 2026：游戏板块的展会日程与试玩动线 | [Tokyo Game Show official site](https://tgs.cesa.or.jp/en/), [U.S. Commercial Service Japan trade events](https://www.trade.gov/japan-trade-events) | Uses the official TGS entry as the event source and the trade-events list for 2026 date/venue confirmation. |
| 漫画补番入口：MANGA Plus 与正版阅读平台怎么放进站内 | [MANGA Plus updates](https://mangaplus.shueisha.co.jp/updates), [App Store page](https://apps.apple.com/us/app/manga-plus-by-shueisha/id1442476536) | Describes the official reading service without copying manga content. |
| 图廊运营规则：番剧海报、COS 照片、游戏截图怎么标注版权 | [Creative Commons Search Portal](https://search.creativecommons.org/), [Wikimedia Commons](https://commons.wikimedia.org/) | Governance note for future asset collection and copyright labeling. |
| 日常番场景资料：咖喱饭、放学后与生活感镜头 | [Kare-Raisu.jpg](https://commons.wikimedia.org/wiki/File:Kare-Raisu.jpg) | Uses food photography as a real-world anime/light-novel scene reference. |

## Schedule Index Sources

| Tool | Main sources | Notes |
| --- | --- | --- |
| 日番 / 国创更新时间表 | [Bilibili 新番时间表](https://www.bilibili.com/anime/timeline/), [Bilibili 国创频道](https://www.bilibili.com/guochuang/), [bilibili-API-collect timeline notes](https://github.com/pskdje/bilibili-API-collect/blob/main/docs/bangumi/timeline.md) | The Express API requests the public PGC timeline endpoint for `types=1` anime and `types=4` guochuang, then normalizes weekday, title, cover, episode, time, and status fields. Mock fallback data is used when the remote source is unavailable. |

## Image Assets

| Local file | Source | Author | License | Site use |
| --- | --- | --- | --- | --- |
| `src/assets/images/content-tokyo-big-sight-night.jpg` | [Tokyo Big Sight at Night.jpg](https://commons.wikimedia.org/wiki/File:Tokyo_Big_Sight_at_Night.jpg) | Masato Ohta | CC BY 2.0 | AnimeJapan and anime-section venue imagery. |
| `src/assets/images/content-comiket-cosplay.jpg` | [Cosplay at Comiket 84.jpg](https://commons.wikimedia.org/wiki/File:Cosplay_at_Comiket_84.jpg) | Guilhem Vellut | CC BY 2.0 | Comiket cosplay article and gallery. |
| `src/assets/images/content-comiket-cosplayers.jpg` | [The Cosplayers of Comiket 69.jpg](https://commons.wikimedia.org/wiki/File:The_Cosplayers_of_Comiket_69.jpg) | stormstill | CC BY-SA 2.0 | COS gallery hero, home cards, carousel options. |
| `src/assets/images/content-game-controller.jpg` | [Panasonic-Q-Controller.jpg](https://commons.wikimedia.org/wiki/File:Panasonic-Q-Controller.jpg) | Evan-Amos | CC BY-SA 3.0 | Game section hero, TGS article, carousel options. |
| `src/assets/images/content-manga-museum-main.jpg` | [Kyoto International Manga Museum - Main Exhibit.jpg](https://commons.wikimedia.org/wiki/File:Kyoto_International_Manga_Museum_-_Main_Exhibit.jpg) | Kento Ikeda | CC BY 2.0 | Legacy manga-culture visuals and future archive cards. |
| `src/assets/images/content-manga-artist-tools.jpg` | [Kyoto International Manga Museum - instruments of an artist.jpg](https://commons.wikimedia.org/wiki/File:Kyoto_International_Manga_Museum_-_instruments_of_an_artist.jpg) | Maplestrip | CC BY 3.0 | Gallery governance article and carousel options. |
| `src/assets/images/content-manga-museum-reading.jpg` | [Sitting people reading outdoors at Kyoto International Manga Museum 20080608.jpg](https://commons.wikimedia.org/wiki/File:Sitting_people_reading_outdoors_at_Kyoto_International_Manga_Museum_20080608.jpg) | Tatyana Temirbulatova | CC BY 2.0 | Reading-space and anime daily-life visuals. |
| `src/assets/images/content-digital-tablet.jpg` | [Hand drawing on a graphic tablet.jpg](https://commons.wikimedia.org/wiki/File:Hand_drawing_on_a_graphic_tablet.jpg) | Piknuz | CC BY-SA 4.0 | Digital creation and official-reading posts. |
| `src/assets/images/content-kare-raisu.jpg` | [Kare-Raisu.jpg](https://commons.wikimedia.org/wiki/File:Kare-Raisu.jpg) | Ocdp | CC0 1.0 | Daily anime/light-novel scene reference. |

## Usage Rules

- Keep attribution in article text, image alt text, or this document when adding local assets.
- CC-licensed photos can still include personality rights or trademark concerns; avoid cropping them into misleading endorsements.
- For commercial anime posters, game screenshots, and official key visuals, record rights holder, source URL, intended use, and whether local storage is allowed.
- Write original summaries and link to official pages rather than copying source text.
