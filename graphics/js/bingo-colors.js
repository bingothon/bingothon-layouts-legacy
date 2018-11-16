'use-strict'
$(()=>{
    const bundleName = 'nodecg-speedcontrol';
    const colorContainerClasses = 'bingo-color';

    const bingoColors = nodecg.Replicant('bingo-colors', bundleName);

    var colorContainers = [
        $('#bingo-color0'),
        $('#bingo-color1'),
        $('#bingo-color2'),
        $('#bingo-color3'),
    ];

    bingoColors.on('change', (newColors, old)=>{
        for(var i in newColors) {
            // kinda dirty method, just replace the entire class attributte, so we don't have to worry
            // about the previous color
            colorContainers[i].attr('class', colorContainerClasses + ' bingo-'+newColors[i]);
        }
    });
});