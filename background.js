//author= Mücahit Sahin
//github=https://github.com/mucahit-sahin

async function openBilingual() {
  let tracks = document.getElementsByTagName("track");
  let en;
  //let tr;
  if (tracks.length) {
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].srclang === "en") {
        en = tracks[i];
      }
    }

    if (en) {
      en.track.mode = "showing";

      await sleep(500);
      let cues = en.track.cues;

      //İngilizce yazıdaki cümle bitiş anlarının tespiti.
      // .....cümle bitti. Yeni cümle
      //Burada sadece nokta karakterinden sonra boşluk olan durumlarda cümlenin bittiği varsayılmıştır.
      // 75.3 , model.fit gibi özel ifade belirten durumlarda noktayı cümle bitişi olarak algılamaması için.
      let endSentence = [];
      for (let i = 0; i < cues.length; i++) {
        for (let j = 0; j < cues[i].text.length; j++) {
          if (cues[i].text[j] == "." && cues[i].text[j + 1] == undefined) {
            endSentence.push(i);
          }
        }
      }
      ///////////////////////

      let cuesTextList = getTexts(cues);

      getTranslation(cuesTextList, (translatedText) => {
        //console.log("getTranslation. translatedText:", translatedText);
        let translatedList = translatedText.split(" z~~~z");
        //console.log("getTranslation. translatedList:", translatedList);
        translatedList.splice(-1, 1);
        // console.log(
        //   "getTranslation. translatedList:.splice(-1, 1)",
        //   translatedList
        // );

        for (let i = 0; i < endSentence.length; i++) {
          if (i != 0) {
            for (let j = endSentence[i - 1] + 1; j <= endSentence[i]; j++) {
              cues[j].text = cues[j].text.split(" z~~~z")[0];
              cues[j].text += "\n\n" + translatedList[i].trim();
              // console.log(translatedList[i]);
            }
          } else {
            for (let j = 0; j <= endSentence[i]; j++) {
              cues[j].text = cues[j].text.split(" z~~~z")[0];
              cues[j].text += "\n\n" + translatedList[i].trim();
              // console.log(translatedList[i]);
            }
          }
        }
      });
    }
  }
}

String.prototype.replaceAt = function (index, replacement) {
  return (
    this.substr(0, index) +
    replacement +
    this.substr(index + replacement.length)
  );
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTexts(cues) {
  let cuesTextList = "";
  for (let i = 0; i < cues.length; i++) {
    /*for(let j=0;j<cues[i].text.length;j++)
    {
      if(cues[i].text[j] == '.' && cues[i].text[j+1] == ' ')
      {
        cues[i].text = cues[i].text.replaceAt(j, ",")
      }
    }*/

    if (cues[i].text[cues[i].text.length - 1] == ".") {
      cues[i].text = cues[i].text.replaceAt(
        cues[i].text.length - 1,
        ". z~~~z "
      );
      //console.log(cues[i].text.replaceAt(cues[i].text.length-1, ". z~~~z "))
    }

    cuesTextList += cues[i].text.replace(/\n/g, " ") + " ";
  }
  return cuesTextList;
}

function getTranslation(words, callback) {
  chrome.storage.sync.get(["lang"], function (result) {
    var lang = result.lang;
    const xhr = new XMLHttpRequest();
    let url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURI(
      words
    )}`;
    xhr.open("GET", url, true);
    xhr.responseType = "text";
    xhr.onload = function () {
      if (xhr.readyState === xhr.DONE) {
        if (xhr.status === 200 || xhr.status === 304) {
          const translatedList = JSON.parse(xhr.responseText)[0];
          let translatedText = "";
          if (translatedList) {
            for (let i = 0; i < translatedList.length; i++) {
              translatedText += translatedList[i][0];
            }
            callback(translatedText);
          }
        }
      }
    };
    xhr.send();
  });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.method == "translate") {
    openBilingual();
    sendResponse({ method: "translated" });
  }
});
