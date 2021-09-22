function gaussianRand(): number {
    var rand = 0;
    const factor = 4;
    for (var i = 0; i < factor; i += 1) {
        rand += Math.random();
    }

    return rand / factor;
}

function gaussianRandom(start: number, end: number): number {
    return Math.floor(start + gaussianRand() * (end - start + 1));
}

export {gaussianRandom}