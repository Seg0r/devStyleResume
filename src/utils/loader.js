const loaderTexts = [
    "PREPARING HYPERDRIVE...",
    "SWAPPING TIME WITH SPACE...",
    "DIVIDING BY ZERO...",
    "CLEANING ENDLESS UNIVERSE...",
    "COOKING STARS...",
    "MESSING WITH GRAVITY...",
    "TESTING YOUR PATIENCE...",
    "HIRING GALAXY ARCHITECT...",
    "PLEASE, INSERT COIN...",
    "CHASING UNICORNS...",
    "LIFE IS SHORT! PLEASE WAIT...",
    "HELP, I'M TRAPPED IN A LOADER!",
];

let index = parseInt(sessionStorage.getItem('loaderIndex'));
if(!index || index >= loaderTexts.length){
    index=0;
}

function setupTypewriter(t) {
    var HTML = "";
    let i=0;
    for ( i = index; i < index+3;) {
        HTML+=loaderTexts[i]+"^ \n"
        i++;
        if(i==loaderTexts.length){            
            i=0;
            index = index - loaderTexts.length;
        }
    }
    sessionStorage.setItem('loaderIndex',i);


    t.innerHTML = "";

    var cursorPosition = 0,
        tag = "",
        writingTag = false,
        tagOpen = false,
        typeSpeed = 100,
      tempTypeSpeed = 0;

    var type = function() {
      
        if (writingTag === true) {
            tag += HTML[cursorPosition];
        }

        if (HTML[cursorPosition] === "<") {
            tempTypeSpeed = 0;
            if (tagOpen) {
                tagOpen = false;
                writingTag = true;
            } else {
                tag = "";
                tagOpen = true;
                writingTag = true;
                tag += HTML[cursorPosition];
            }
        }

        if (!writingTag && tagOpen) {
            tag.innerHTML += HTML[cursorPosition];
        }
        if (!writingTag && !tagOpen) {
            if (HTML[cursorPosition] === " ") {
                tempTypeSpeed = 0;
            } else {
                tempTypeSpeed = (Math.random() * typeSpeed) + 50;
            }
            if(HTML[cursorPosition] === "^"){
                cursorPosition +=1;
                tempTypeSpeed = (Math.random() * typeSpeed) + 1050;
            }else{
                t.innerHTML += HTML[cursorPosition];
            }
        }
        if (writingTag === true && HTML[cursorPosition] === ">") {
            tempTypeSpeed = (Math.random() * typeSpeed) + 50;
            writingTag = false;
            if (tagOpen) {
                var newSpan = document.createElement("span");
                t.appendChild(newSpan);
                newSpan.innerHTML = tag;
                tag = newSpan.firstChild;
            }
        }

        cursorPosition += 1;
        if (cursorPosition < HTML.length - 1) {
            setTimeout(type, tempTypeSpeed);
        }

    };

    return {
        type: type
    };
}



export {setupTypewriter};