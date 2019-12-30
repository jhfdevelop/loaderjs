/*
* This script provides lightweight HTML template loading via the current hash (http://your.url/#something).
* It enables the possibility to define a base-html witch defines a "content-area" that renders the loaded templates (eg. same header and footer).
* This is useful to reduce traffic and overhead.
* */

class Loader {
    /*
    * Initialize the loader.
    * Options are passed via an object.
    * The class subscribes to the window.hashchange event to recognize changes of the hash
    *
    * Example:
    *
    * const options = {
    *   //required
    *   contentEl: document.getElementById('content'),
    *   defaultTemplate:'about',
    *
    *   //required if updateTitle==true (default)
    *   titleBase: 'My awesome website',
    *
    *   //optional
    *   templatesDir: '/pages',
    *   updateTitle: true,
    *   scrollTop: true
    * }
    *
    * let loader = new Loader(options)
    * loader.addEventListener('templateLoaded', evt => {doSth(evt.template)})
    *
    * Option Properties:
    *   contentEl (required, HTMLElement): element where templates are rendered
    *   defaultTemplate: (required, string): default template to load when there is no hash or there was a problem while loading the current template
    *   titleBase: (required if updateTitle==true, string): default title before the template eg. titleBase | template
    *   templatesDir: (optional, string): location to load the templates from. Default value is '/templates'
    *   updateTitle: (optional, boolean): Sets if the title should be updated when a template is set. Defaults to true
    *   scrollTop: (optional, boolean): Sets if the document should scroll to the top after a template is set. Defaults to true
    * */
    constructor(options) {
        this._hashListener = this._onHashChanged.bind(this)
        this.currentTemplate = ''
        this._hashListenerRegistered = false

        this._getOpts(options)
        this.setListening(true)
        this._onHashChanged()
    }

    /*
    * The main method of the class. It is called to load a template on hash change.
    * However, you can invoke it on your own without changing the window's hash
    * */
    load(template) {
        this._fetchTemplate(template)
            .then(el => this._setTemplate(el))
            .then(() => this.currentTemplate = template)
            .then(() => this._setTitle())
            .then(() => this._dispatchLoadedEvent())
            .catch(err => {
                console.log(err)
                window.location.hash = `#${this.errorTemplate}`
            })
    }

    /*
    * subscribe or unsubscribe from the hashchange event.
    * You don't need to call it directly to activate it after the constructor call.
    * However, you can use this method to detach the listener for a time and to activate it later
    * */
    setListening(listening) {
        if (listening && !this._hashListenerRegistered) {
            window.addEventListener('hashchange', this._hashListener, true)
            this._hashListenerRegistered = true

        } else if (!listening && this._hashListenerRegistered) {
            window.removeEventListener('hashchange', this._hashListener, true)
            this._hashListenerRegistered = false
        }
    }

    _getOpts(options) {
        //mandatory
        this.contentEl = options.contentEl
        this.defaultTemplate = options.defaultTemplate

        //optional
        this.templatesDir = options.templatesDir || '/templates'
        this.updateTitle = options.updateTitle || true
        this.scrollTop = options.scrollTop || true
        this.errorTemplate = options.errorTemplate || this.defaultTemplate

        if (this.updateTitle) {
            this.titleBase = options.titleBase
        }
    }

    _onHashChanged() {
        const template = window.location.hash.replace('#', '') || this.defaultTemplate
        this.load(template)
    }

    _fetchTemplate(template) {
        return fetch(`${this.templatesDir}/${template}.html`)
            .then(data => data.text())
            .then(data => this._parseTemplate(data))
    }

    _parseTemplate(templateData) {
        return new Promise(resolve => {
            const templateEl = document.createElement('div')
            templateEl.innerHTML = templateData
            resolve(templateEl.querySelector('template'))
        })
    }

    _setTemplate(el) {

        if (this.scrollTop) {
            window.scrollTo({top: 0})
        }

        this._clearNode(this.contentEl)
        this.contentEl.appendChild(el.content.cloneNode(true))
    }

    _clearNode(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild)
        }
    }

    _dispatchLoadedEvent() {
        let currentTemplate = this.currentTemplate
        let me = this

        const event = new CustomEvent('templateLoaded', {
            detail: {
                template: currentTemplate,
                source: me
            }
        })

        dispatchEvent(event)
    }

    _setTitle() {
        if (this.updateTitle) {
            document.title = `${this.titleBase} | ${this.currentTemplate}`
        }
    }
}

export {Loader as default}
