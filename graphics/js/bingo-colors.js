'use-strict'
$(()=>{
    const bundleName = 'nodecg-speedcontrol';
    const colorContainerClasses = 'bingo-color';

    const bingoColors = nodecg.Replicant('bingo-colors', bundleName);
    const bingoBoard = nodecg.Replicant('bingoboard', bundleName);

    var colorContainers = [
        $('#bingo-color0'),
        $('#bingo-color1'),
        $('#bingo-color2'),
        $('#bingo-color3'),
    ];

    // put the goal count in there
    const goalCountHtml = '<div class="goal-count" style="opacity:1;"></div>'
    colorContainers.forEach((container) => {
        container.html(goalCountHtml);
    })

    bingoColors.on('change', (newColors, old)=>{
        for(var i in newColors) {
            // kinda dirty method, just replace the entire class attributte, so we don't have to worry
            // about the previous color
            colorContainers[i].attr('class', colorContainerClasses + ' bingo-'+newColors[i]);
        }
        // on init the bingoGoals are undefined and will be filled later, update happens there
        if (bingoBoard.value) {
            updateGoalCounts(bingoBoard.value.goalCounts);
        }
    });

    bingoBoard.on('change', (newBoard, old) => {
        updateGoalCounts(newBoard.goalCounts);
        // update hiding the numbers
        if (!old || newBoard.goalCountShown != old.goalCountShown) {
            if (newBoard.goalCountShown) {
                $('.goal-count').show();
            } else {
                $('.goal-count').hide();
            }
        }
    });

    function updateGoalCounts(newGoalCounts) {
        for(var i = 0;i<4;i++) {
            // update only if it exists
            if (colorContainers[i].length) {
                colorContainers[i].find('.goal-count').text(newGoalCounts[bingoColors.value[i]]);
            }
        }
    }
});