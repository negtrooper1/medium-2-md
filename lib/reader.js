const fs = require('fs');
const cheerio = require('cheerio');
const yaml = require('js-yaml');
const url = require('url');
// const fetch = require('node-fetch');

const frontMatterTemplate = {
    title: "",
    excerpt: "",
    subtitle: "",
    readTime: "",
    publication: "",
    partnered: "",
    draft: "",
    date: "",
    slugMedium: "",
};

var readAll = function (filePath, frontMatterConfig, partnerFile) {
    const contents = fs.readFileSync(filePath);
    const partneredContents = fs.readFileSync(partnerFile);
    const isDraft = filePath.includes("draft_");
    let partneredPosts = [];

    let $ = cheerio.load(contents);
    let canonical = $('.p-canonical').attr('href');
    $('.graf--title').remove();
    $('.graf--subtitle').remove();
    $('.section-divider').remove();

    let html = $('.e-content').html() || '';
    if (frontMatterConfig !== true) {
        html = $('.h-entry').html() || '';
    }

    // Handle partner check
    let p$ = cheerio.load(partneredContents);
    let p_html = p$('ul').html() || '';
    partneredPosts = p_html.split('<li class=\"h-entry\">');
    let slugEnd = canonical.split('/').pop();

    const title = $('.p-name').text();
    const subtitle = $('.p-summary[data-field="subtitle"]').text();
    const partnered = checkPartnered(slugEnd, partneredPosts) ? '1' : '';
    const draft = isDraft ? '1' : '';
    const publication = isDraft ? '' : 'Publication Here'
    const date = $('.dt-published').attr('datetime');
    const slugMedium = canonical ? url.parse(canonical).path : '';

    // no tags available in the exported HTML files    

    const frontMatter = generateFrontMatter(title, subtitle, date, slugMedium, partnered, draft, publication);

    return { html, frontMatter };
}

// Convert from url has been removed.
// Medium posts seem to have updated (random) css classes and html attributes,
// and the reader is unable to extract the article content from the html body.

// var readFromUrl = async function (postUrl) {
//     const response = await fetch(postUrl);
//     const body = await response.text();

//     const $ = cheerio.load(body);

//     $('.section-divider').remove();

//     const html = $('.postArticle-content').html() || '';
//     const title = $(".graf--title").text();
//     const subtitle = $("meta[name='description']").attr("content");
//     const date = $("meta[property='article:published_time']").attr("content");
//     const canonical = $("link[rel='canonical']").attr("href");
//     const slugMedium = canonical ? url.parse(canonical).path : '';

//     const tags = [];
//     $(".js-postTags li").each((i, e) => tags.push($(e).text()));

//     const frontMatter = generateFrontMatter(title, subtitle, date, slugMedium, tags);

//     return {
//         html,
//         title,
//         frontMatter
//     };
// }

var generateFrontMatter = function (title, subtitle, date, slugMedium, partnered, draft, publication) {
    const frontMatter = Object.assign({}, frontMatterTemplate);
    frontMatter.title = title.toString().replace(/\n/g, '');
    frontMatter.excerpt = subtitle ? subtitle.toString().replace(/\n/g, '') : '';
    frontMatter.subtitle = subtitle ? subtitle.toString().replace(/\n/g, '') : '';
    frontMatter.readTime = '';
    frontMatter.date = date ? date.toString() : '';
    frontMatter.slugMedium = slugMedium ? slugMedium.toString() : '';
    frontMatter.partnered = partnered ? partnered : '';
    frontMatter.draft = draft ? draft : '';
    frontMatter.publication = publication ? publication : '';
    const yml = yaml.safeDump(frontMatter);
    return yml;
}

// If the end of the slug matches any of the hrefs in our list, then we assume it's partnered
const checkPartnered = function (slugEnd, partneredPosts) {    
    return partneredPosts.some((post) => post.includes(slugEnd));
}

module.exports = {
    readAll
    // readFromUrl
}
