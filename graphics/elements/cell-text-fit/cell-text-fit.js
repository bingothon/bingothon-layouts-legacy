(function () {
	'use strict';
    
	class cellTextFit extends Polymer.Element {
		static get is() {
			return 'cell-text-fit';
		}

		static get properties() {
		    return {
		        text: {
                    type: String,
                    observer: '_textChanged'
                },
			};
        }

        _textChanged(text) {
            this.fit();
		}

		fit() {
			this._fitDebouncer = Polymer.Debouncer.debounce(
				this._fitDebouncer,
				Polymer.Async.timeOut.after(0),
				this._fit.bind(this)
			);
		}
		
		_fit() {
			Polymer.RenderStatus.beforeNextRender(this, () => {
				this.$.fittedContent.style.transform = `translateY(-50%) scaleX(1) scaleY(1)`;
				// get width height of parent and text container to calc scaling
				var scaleX = this.$.container.scrollWidth / this.$.fittedContent.scrollWidth;
				var scaleY = this.$.container.scrollHeight / this.$.fittedContent.scrollHeight;
				// limit max scale to 1
				scaleX = Math.min(1,scaleX);
				scaleY = Math.min(1,scaleY);
				this.$.fittedContent.style.transform = `translateY(-50%) scaleX(${scaleX}) scaleY(${scaleY})`;
			});
		}
        
	}

	customElements.define(cellTextFit.is, cellTextFit);
})();
