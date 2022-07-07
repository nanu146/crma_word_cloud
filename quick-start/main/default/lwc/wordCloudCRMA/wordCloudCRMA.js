import { LightningElement, api } from 'lwc';
import wordCloud2 from '@salesforce/resourceUrl/wordcloud2';
import posUrl from '@salesforce/resourceUrl/pos';
import { loadScript } from 'lightning/platformResourceLoader';

export default class wordCloudCRMA extends LightningElement {
  @api results;
  @api metadata;
  @api selection;
  @api setSelection;
  @api selectMode;
  @api getState;
  @api setState;

  @api wordColumn;
  @api measureColumn;
  @api POSList;
  @api height;
  @api width;
  @api minTextSize;

  list = [];

  jsInitialized = false;

  get getResults() {
    console.log('results changed');
    return this.results;
  }

  renderedCallback() {
    this.results.forEach((row) => {
      this.list.push([row[this.wordColumn], row[this.measureColumn]]);
    });

    console.log(this.list);

    Promise.all([loadScript(this, wordCloud2 + '/wordcloud2.js'), loadScript(this, posUrl + '/pos.js')])
      .then(() => {
        let texts = ['This is a demo of word cloud', 'Hello world! how are you doing?', 'I am doing just fine'];
        let listHold = [];
        for (let i = 0; i < this.results.length; i = i + 1) {
          let lex = new pos.default.Lexer();
          let tagger = new pos.default.Tagger();

          lex = lex.lex(this.results[i][this.wordColumn]);
          console.log('lexer output', lex);
          let tag = tagger.tag(lex);
          listHold = listHold.concat(tag);
        }

        console.log('tagger output', listHold);

        listHold = listHold.filter((d) => {
          return this.POSList.replace(' ', '').split(',').includes(d[1]);
        });
        console.log(listHold);

        let listDict = {};
        for (let j = 0; j < listHold.length; j = j + 1) {
          let wordProp = listHold[j];
          let word = wordProp[0];
          if (listDict.hasOwnProperty(word)) {
            listDict[word] = listDict[word] + 1;
          } else {
            listDict[word] = 1;
          }
        }

        console.log(listDict);

        let keys = Object.keys(listDict);
        let finalList = [];

        for (let k = 0; k < keys.length; k = k + 1) {
          finalList.push([keys[k], listDict[keys[k]]]);
        }

        console.log('final list', finalList);

        finalList;

        this.jsInitialized = true;
        this.initializeWordCloud(finalList);
      })
      .catch((error) => {
        this.error = error;
        console.error(error);
      });
  }

  initializeWordCloud(WordList) {
    var canvas = this.template.querySelector('canvas.my_canvas');
    canvas.width = this.width.toString();
    canvas.height = this.height.toString();
    window.WordCloud.minSize = this.minTextSize;
    window.WordCloud(this.template.querySelector('canvas.my_canvas'), {
      list: WordList,
      shrinkToFit: true,
      weightFactor: 10
    });
  }
}
