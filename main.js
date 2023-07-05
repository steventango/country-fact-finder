/*global mdc*/
const Main = {
  current: null,
  async list() {
    const region_map = {
      'Africa': 'africa',
      'Antarctica': 'antarctica',
      'Oceania': 'australia-oceania',
      'Central America and Caribbean': 'central-america-n-caribbean',
      'Central Asia': 'central-asia',
      'East and Southeast Asia': 'east-n-southeast-asia',
      'Europe': 'europe',
      'Middle East': 'middle-east',
      'North America': 'north-america',
      'Oceans': 'oceans',
      'South America': 'south-america',
      'South Asia': 'south-asia',
      'World': 'world'
    };
    const data = await fetch('entities.json'); //request entities.json file from network/cache
    const json = await data.json(); // read file as json
    const list = document.getElementById('list');
    const last = document.getElementById('last'); //get last element in the list
    //generate list HTML, that is shown in side bar
    for (const region in json) {
      const h6 = document.createElement('h6');
      h6.classList.add('mdc-list-group__subheader');
      h6.innerText = region;
      list.insertBefore(h6, last); //regions become headings
      for (const name in json[region]) {
        const a = document.createElement('a');
        a.classList.add('mdc-list-item', 'queryable');
        a.dataset.mdcAutoInit = 'MDCRipple';
        a.addEventListener('click', () => {
          //on any list element highlight the new selected country and unhighlight the old one
          const previous = document.querySelector('.mdc-list-item--activated');
          if (previous) {
            previous.classList.remove('mdc-list-item--activated');
          }
          a.classList.add('mdc-list-item--activated');
          this.render(region_map[region], json[region][name]); //display the country on the right
        });
        const span = document.createElement('span');
        span.classList.add('mdc-list-item__text');
        span.innerText = name;
        a.appendChild(span);
        list.insertBefore(a, last); //countries/entities become normal list elements
      }
      const hr = document.createElement('hr');
      hr.classList.add('mdc-list-divider');
      list.insertBefore(hr, last);
    }
    mdc.autoInit(); //initiates the ink ripples work
  },
  async render(region, name) {
    function format(text) {
      if (text) {
        return text
        .replace(/sq km/g, 'km²')
        .replace(/^ \+\+ /, '') //replaces "++" at the beginning of lines with ""
        .replace(/ \+\+ /g, '\n'); //replaces other "++" with a new line
      } else {
        return ''
      }
    }
    if (this.current != name) { //only render if user changes countries
      this.current = name;
      document.getElementById('progress_bar').style.display = 'block'; //show progress bar in case connection is slow
      const raw = await fetch(`https://raw.githubusercontent.com/factbook/factbook.json/master/${region}/${name}.json`);
      const data = await raw.json();

      const article = document.getElementById('article');

      //remove all nodes from previous article
      while (article.firstChild) {
        article.removeChild(article.firstChild);
      }
      document.getElementById('article').scrollTop = 0; //scroll to top of page
      //generate article HTML
      for (const category in data) {
        const cell = document.createElement('div');
        cell.classList.add('mdc-layout-grid__cell', 'mdc-layout-grid__cell--span-12');
        const card = document.createElement('div');
        card.classList.add('mdc-card');
        const h1 = document.createElement('h1');
        h1.innerText = category;
        card.appendChild(h1);

        for (const heading in data[category]) {
          const info = data[category][heading];
          const h2 = document.createElement('h2');
          h2.innerText = heading;
          card.appendChild(h2);
          for (const property in info) {
            const p = document.createElement('p');
            if (property != 'text') {
              const h3 = document.createElement('h3');
              h3.innerText = property;
              card.appendChild(h3);
              p.innerHTML = format(info[property].text);
            } else {
              p.innerHTML = format(info.text);
            }
            card.appendChild(p);
          }
        }
        cell.appendChild(card);
        article.appendChild(cell);
      }
      //hide progress bar when HTML has been displayed
      document.getElementById('progress_bar').style.display = 'none';
    }
  },
  search: {
    _textfield: new mdc.textField.MDCTextField(document.getElementById('search_bar')),
    keyup() {
      const query = this.value.trim().split(' ');
      const nodes = Array.from(document.querySelectorAll('.mdc-drawer .mdc-list-item.queryable')); //list of queryable countries
      if (query[0].length > 0) { //only continue if query exists
        const regex = new RegExp('^' + query.join('|'), 'i'); //case Insensitive regex that tests for a String starting with any part of the query

        //https://developers.google.com/web/fundamentals/performance/rendering/avoid-large-complex-layouts-and-layout-thrashing
        //this technique of defering layout improves search performance (589ms => 40ms)
        const show = [];
        const hide = [];
        nodes.forEach((node) => {
          //usage of node.textContent, as node.innerText forcefully recalculates layout, which is bad for performance
          //searches for the query in multiple words. For Example, "States" will return true for "United States"
          if (!node.textContent.split(' ').some((word) => regex.test(word))) {
            hide.push(node);
          } else {
            show.push(node);
          }
        });
        // Recalculate Layout
        hide.forEach((node) => node.style.display = 'none');
        show.forEach((node) => node.style.display = 'flex');
      } else {
        nodes.forEach((node) => node.style.display = 'flex'); //when query is empty show all entities
      }
    },
    init() {
      this._textfield.input_.addEventListener('input', this.keyup);
    }
  },
  main() {
    if ('serviceWorker' in navigator) { //if ServiceWorker is supported by browser
      window.addEventListener('load', () => {
        //register a service worker, used to cache resources, to prevent redundant server requests.
        navigator.serviceWorker.register('sw.js').then(() => {
          console.log('ServiceWorker Registered');
        }, (error) => {
          console.error('ServiceWorker registration failed: ', error);
        });
      });
    }
    this.list();
    this.search.init();
  }
};


Main.main();
