/* global hexo */

'use strict';

var pathFn = require('path');
var _ = require('lodash');
var cheerio = require('cheerio');
var lunr = require('lunr');

var localizedPath = ['docs', 'api'];

function startsWith(str, start) {
  return str.substring(0, start.length) === start;
}

/**
 * 将数组内元素分组的函数，例如 chunk([1, 2, 3, 4], 2) 返回 [[1, 2], [3, 4]]
 * @param {Array} array 数组
 * @param {number} number 每组的元素数量
 */
const chunk = (array, number) => {
  return Array.isArray(array)
      ? array.reduce((list, item) => {
          const length = list.length
          const lastItem = list[length - 1]

          if (Array.isArray(lastItem) && lastItem.length < number) {
              lastItem.push(item)
          } else {
              list.push([item])
          }

          return list
      }, [])
      : []
}

hexo.extend.helper.register('page_nav', function() {
  var type = this.page.canonical_path.split('/')[0];
  var sidebar = this.site.data.sidebar[type];
  var path = pathFn.basename(this.path);
  var list = {};
  var prefix = 'sidebar.' + type + '.';

  for (var i in sidebar) {
    for (var j in sidebar[i]) {
      list[sidebar[i][j]] = j;
    }
  }

  var keys = Object.keys(list);
  var index = keys.indexOf(path);
  var result = '';

  if (index > 0) {
    result += '<a href="' + keys[index - 1] + '" class="article-footer-prev" title="' + this.__(prefix + list[keys[index - 1]]) + '">'
      + '<i class="fa fa-chevron-left"></i><span>' + this.__('page.prev') + '</span></a>';
  }

  if (index < keys.length - 1) {
    result += '<a href="' + keys[index + 1] + '" class="article-footer-next" title="' + this.__(prefix + list[keys[index + 1]]) + '">'
      + '<span>' + this.__('page.next') + '</span><i class="fa fa-chevron-right"></i></a>';
  }

  return result;
});

hexo.extend.helper.register('doc_sidebar', function(className) {
  var type = this.page.canonical_path.split('/')[0];
  var sidebar = this.site.data.sidebar[type];
  var path = pathFn.basename(this.path);
  var result = '';
  var self = this;
  var prefix = 'sidebar.' + type + '.';

  _.each(sidebar, function(menu, title) {
    result += '<strong class="' + className + '-title">' + self.__(prefix + title) + '</strong>';

    _.each(menu, function(link, text) {
      var itemClass = className + '-link';
      if (link === path) itemClass += ' current';

      result += '<a href="' + link + '" class="' + itemClass + '">' + self.__(prefix + text) + '</a>';
    });
  });

  return result;
});

hexo.extend.helper.register('header_menu', function(className) {
  var menu = this.site.data.menu;
  var result = '';
  var self = this;
  var lang = this.page.lang;
  var isEnglish = lang === 'en';

  _.each(menu, function(path, title) {
    if (!isEnglish && ~localizedPath.indexOf(title)) path = lang + path;

    result += '<a href="' + self.url_for(path) + '" class="' + className + '-link">' + self.__('menu.' + title) + '</a>';
  });

  return result;
});

hexo.extend.helper.register('canonical_url', function(lang) {
  var path = this.page.canonical_path;
  if (lang && lang !== 'en') path = lang + '/' + path;

  return this.config.url + '/' + path;
});

hexo.extend.helper.register('url_for_lang', function(path) {
  var lang = this.page.lang;
  var url = this.url_for(path);

  if (lang !== 'en' && url[0] === '/') url = '/' + lang + url;

  return url;
});

hexo.extend.helper.register('raw_link', function(path) {
  return 'https://github.com/feflow/feflow/edit/master/docs/' + path;
});

hexo.extend.helper.register('page_anchor', function(str) {
  var $ = cheerio.load(str, {decodeEntities: false});
  var headings = $('h1, h2, h3, h4, h5, h6');

  if (!headings.length) return str;

  headings.each(function() {
    var id = $(this).attr('id');

    $(this)
      .addClass('article-heading')
      .append('<a class="article-anchor" href="#' + id + '" aria-hidden="true"></a>');
  });

  return $.html();
});

hexo.extend.helper.register('lunr_index', function(data) {
  var index = lunr(function() {
    this.field('name', {boost: 10});
    this.field('tags', {boost: 50});
    this.field('description');
    this.ref('id');

    _.sortBy(data, 'name').forEach((item, i) => {
      this.add(_.assign({ id: i }, item));
    });
  });

  return JSON.stringify(index);
});

hexo.extend.helper.register('canonical_path_for_nav', function() {
  var path = this.page.canonical_path;

  if (startsWith(path, 'docs/') || startsWith(path, 'api/')) {
    return path;
  }
  return '';

});

hexo.extend.helper.register('lang_name', function(lang) {
  var data = this.site.data.languages[lang];
  return data.name || data;
});

hexo.extend.helper.register('disqus_lang', function() {
  var lang = this.page.lang;
  var data = this.site.data.languages[lang];

  return data.disqus_lang || lang;
});

hexo.extend.helper.register('hexo_version', function() {
  return this.env.version;
});

hexo.extend.helper.register('encologiesTags', function () {
  const { encologies } = this.site.data
  const tags = Array.from(new Set(encologies.map(item => item.tag)))

  return tags
})

hexo.extend.helper.register('encologies', function () {
  const { encologies } = this.site.data
  // 如果没有 Logo，则从中选取一种颜色作为背景色
  const colors = ['#337bff', '#20bdff', '#7dedda', '#2197ff']

  const encologieGroups =  chunk(encologies.map(item => {
    const { id = '', name = '', tag = '', logo = '', master = '', overview = '', description = '' } = item;
    const base = { id, name, tag, logo, master, overview, description };

    if (!logo) {
      const colorIndex = Math.floor(colors.length * Math.random());
      const color = colors[colorIndex];
      const firstLetter = name[0].toLocaleUpperCase()

      base.color = color
      base.firstLetter = firstLetter
    }

    return base
  }), 3)
  // 如果最后一个没满三个，则给补上
  const length = encologieGroups.length
  const final = encologieGroups[length - 1]
  if (final.length < 3) {
    for (let index = 0; index < 3 - final.length; index++) {
      final.push('');
    }
  }

  return encologieGroups
})

