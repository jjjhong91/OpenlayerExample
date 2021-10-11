let local_modify;
let isModify = false;
class EnableModificationControl extends ol.control.Control {
    /**
     * @param {Object} [opt_options] Control options.
     */
    constructor(opt_options) {
        const options = opt_options || {};
        local_modify = options.modify;

        const button = document.createElement('button');
        button.innerHTML = 'M';

        const element = document.createElement('div');
        element.className = 'rotate-north ol-unselectable ol-control';
        element.appendChild(button);

        super({
            element: element,
            target: options.target,
        });

        button.addEventListener('click', this.handleModification.bind(this), false);
    }

    handleModification() {
        var interactions = this.getMap().getInteractions();
        if (isModify) {
            this.getMap().removeInteraction(local_modify);
        } else {
            this.getMap().addInteraction(local_modify);
        }

        isModify = !isModify;
    }
}