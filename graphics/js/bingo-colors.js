'use-strict'
$(()=>{
    const bingothonBundleName = 'speedcontrol-bingothon';
    const colorContainerClasses = 'bingo-color';

    const bingoColors = nodecg.Replicant('bingo-colors', bingothonBundleName);
    const bingoBoard = nodecg.Replicant('bingoboard', bingothonBundleName);

    var colorContainers = $('.bingo-color');

    // put the goal count in there
    const goalCountHtml = '<div class="goal-count" style="opacity:1;"></div>'
    colorContainers.each((index,element) => {
        $(element).html(goalCountHtml);
    })

    bingoColors.on('change', (newColors, old)=>{
        colorContainers.each((index,element)=>{
            $(element).attr('class', colorContainerClasses + ' bingo-'+newColors[index]);
        });
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
        if (!old || newBoard.colorShown != old.colorShown) {
            if (newBoard.colorShown) {
                $('.bingo-color').show();
            } else {
                $('.bingo-color').hide();
            }
        }
    });

    function updateGoalCounts(newGoalCounts) {
        colorContainers.each((index,element)=>{
            $(element).find('.goal-count').text(newGoalCounts[bingoColors.value[index]]);
        });
    }
});