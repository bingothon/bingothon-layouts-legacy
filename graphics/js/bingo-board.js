$(()=>{
    /**Begin bingosync methods */
    function getSquareColorClass(color) {
        return color + "square";
    }

    ORDERED_COLORS = ["pink", "red", "orange", "brown", "yellow", "green", "teal", "blue", "navy", "purple"];

    function sortColors(colors) {
        orderedColors = [];
        for (var i = 0; i < ORDERED_COLORS.length; i++) {
            if (colors.indexOf(ORDERED_COLORS[i]) !== -1) {
                orderedColors.push(ORDERED_COLORS[i]);
            }
        }
        return orderedColors;
    }


    function setSquareColors($square, colors) {
        $square.children('.bg-color').remove();
        colors = colors.split(' ');
        var shadow = $square.children('.shadow');
        colors = sortColors(colors);
        $square.attr("title", colors.join("\n"));
        // the color offsets seem to work right-to-left, so reverse the array first
        colors.reverse();
        colors.forEach(function (color) {
            shadow.before('<div class="bg-color ' + getSquareColorClass(color) + '"></div>');
        });
        updateColorOffsets($square);
    }
    
    function updateColorOffsets($square) {
        var $colorElements = $square.children('.bg-color');
        var numColors = $colorElements.length;
        var translatePercent = {
            2: ['0', '0'],
            3: ['0', '36', '-34'],
            4: ['0', '46', '0', '-48'],
            5: ['0', '56', '18', '-18', '-56'],
            6: ['0', '60', '30', '0', '-30', '-60'],
            7: ['0', '64', '38', '13', '-13', '-38', '-64'],
            8: ['0', '64', '41', '20', '0', '-21', '-41', '-64'],
            9: ['0', '66', '45', '27', '9', '-9', '-27', '-45', '-66'],
            10: ['0', '68', '51', '34', '17', '0', '-17', '-34', '-51', '-68']
        };
        var translations = translatePercent[numColors];
    
        var curWidth = $colorElements.width();
        var curHeight = $colorElements.height();
        var targetAngle = Math.atan(curWidth/curHeight);
    
        $($colorElements[0]).css('transform', '');
        for (var i = 1; i < $colorElements.length; ++i) {
            var transform = 'skew(-' + targetAngle + 'rad) translateX(' + translations[i] + '%)';
            $($colorElements[i]).css('transform', transform);
            $($colorElements[i]).css('border-right', 'solid 1.5px #444444');
        }
    }
    /**End bingosync methods */

    // Replicants
    const boardRep = NodeCG.Replicant('bingoboard','nodecg-speedcontrol');

    boardRep.on('change', (newGoals, oldGoals) => {
        if (!newGoals || !newGoals.cells) {
            return;
        }
        // check if init
        if (!oldGoals) {
            createBingoBoard();
        }
        for (var i in newGoals.cells) {
            const newGoal = newGoals.cells[i];
            // check if goal needs to be updated
            if (!oldGoals || !oldGoals.cells || oldGoals.cells[i].name != newGoal.name || oldGoals.cells[i].colors != newGoal.colors) {
                var colors = newGoal.colors == 'blank' ? '' : newGoal.colors;
                setSquareColors($('#'+newGoal.slot),colors);
                $('#'+newGoal.slot).find('.text-container').text(newGoal.name);
            }
        }
    })

    function createBingoBoard() {
        var bingoConainer = $('#bingo-container');
        if (!bingoConainer) {
            nodecg.log.error('No bingo container found!');
            return;
        }
        var bingoHtml = '<table class="bingo-table">'
        for (var i = 0;i<5;i++) {
            bingoHtml += '<tr>';
            for (var j = 0;j<5;j++) {
                bingoHtml += '<td><div id="slot'+(i*5+j+1)+'" class="square"><div class="shadow"></div><div class="text-container vertical-center"></div></div></td>';
            }
            bingoHtml += '</tr>';
        }
        bingoHtml += '</table>';
        bingoConainer.html(bingoHtml);
    }
    
});