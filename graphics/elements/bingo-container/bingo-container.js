(function () {
	'use strict';
    const board = nodecg.Replicant('bingoboard','speedcontrol-bingothon');
    
    // used from bingosync
    const translatePercent = {
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

    const ORDERED_COLORS = ["pink", "red", "orange", "brown", "yellow", "green", "teal", "blue", "navy", "purple"].reverse();

    function sortColors(colors) {
        var orderedColors = [];
        for (var i = 0; i < ORDERED_COLORS.length; i++) {
            if (colors.indexOf(ORDERED_COLORS[i]) !== -1) {
                orderedColors.push(ORDERED_COLORS[i]);
            }
        }
        return orderedColors;
    }

	class bingoContainer extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'bingo-container';
		}

		static get properties() {
		    return {
		        
			};
        }
        
        constructor() {
            super();
            this.boardHidden = true;
            this.splashActivated = "";
            this.rows = [];
            this.skewAngle=1;
            for (var i = 0;i<5;i++) {
                var row = [];
                for (var j = 0;j<5;j++) {
                    row.push({name:"test",colors:[]});
                }
                this.rows.push(row);
            }
        }

		ready() {
            super.ready();
            // set skew angle needed for bingosync color backgrounds
            var table = Polymer.dom(this.root).querySelector('table');
            this.skewAngle = Math.atan(table.scrollWidth / table.scrollHeight);
            board.on('change',(newGoals, oldGoals)=>{
                if (!newGoals || !newGoals.cells) return;
                this.boardHidden = newGoals.boardHidden;
                var idx = 0;
                this.rows.forEach((row, rowIndex)=>{
                    row.forEach((cell,columnIndex)=>{
                        // update cell with goal name, if changed
                        var newCell = newGoals.cells[idx];
                        if (!oldGoals || newCell.name != oldGoals.cells[idx].name) {
                            this.set(`rows.${rowIndex}.${columnIndex}.name`, newCell.name);
                        }
                        // update cell with color backgrounds, if changed
                        if (!oldGoals || newCell.colors != oldGoals.cells[idx].colors) {
                            var colors = newCell.colors.split(' ');
                            if (colors[0]!="blank") {
                                colors = sortColors(colors);
                                var newColors = [];
                                newColors.push({color: colors[0], style: ''});
                                var translations = translatePercent[colors.length];
                                for(var i = 1;i<colors.length;i++) {
                                    // how bingosync handles the backgrounds, set style here to simply bind it to html later
                                    newColors.push({color: colors[i], style:
                                        `transform: skew(-${this.skewAngle}rad) translateX(${translations[i]}%); border-right: solid 1.5px #444444`
                                    });
                                }
                                this.set(`rows.${rowIndex}.${columnIndex}.colors`, newColors);
                                console.log(newColors);
                            } else {
                                cell.colors = [];
                            }
                        }
                        idx++;
                    });
                });
            });
            nodecg.listenFor('showBingoAnimation','speedcontrol-bingothon',()=>{
                // if the animation is currently running do nothing
                if (this.splashActivated != "") return;
                this.splashActivated = "activated";
                setTimeout(()=>this.splashActivated="",4000);
            });
		}
	}

	customElements.define(bingoContainer.is, bingoContainer);
})();
