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
			if (document.readyState !== 'complete') {
				window.addEventListener('load', () => {
					this._textChanged(this.text);
				});
				return;
			}

			const font = window.getComputedStyle(this.$.fittedContent).font;
			if (!font) {
				this.$.fittedContent.style.visibility = 'visible';
				this.fit();
				return;
			}

			document.fonts.load(font).then(() => {
				this.$.fittedContent.style.visibility = 'visible';
				this.fit();
			}).catch(e => {
				console.error('Failed to load fonts:', e);
			});
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
				this.$.fittedContent.style.transform = `scaleX(1) scaleY(1)`;
				this.$.fittedContent.style.top = "0";
				// get width height of parent and text container to calc scaling
				var scaleX = this.$.container.scrollWidth / this.$.fittedContent.scrollWidth;
				var scaleY = this.$.container.scrollHeight / this.$.fittedContent.scrollHeight;
				// limit max scale to 1
				scaleX = Math.min(1,scaleX);
				scaleY = Math.min(1,scaleY);
				// center
				var toLeft = (this.$.container.scrollWidth - this.$.fittedContent.scrollWidth) / 2;
				this.$.fittedContent.style.transform = `translateY(-50%) translateX(${toLeft}px) scaleX(${scaleX}) scaleY(${scaleY})`;
				this.$.fittedContent.style.top = "50%";
			});
		}
        
	}

	customElements.define(cellTextFit.is, cellTextFit);
})();
