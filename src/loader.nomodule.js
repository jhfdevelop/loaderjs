/*
* Compatibility version of loader.js
* Used in browsers that do not support ES6 modules
* */


window.Loader = function (options) {
    this._hashListener = this._onHashChanged.bind(this)
    this.currentTemplate = ''
    this._hashListenerRegistered = false

    this._getOpts(options)
    this.setListening(true)
    this._onHashChanged()
}

window.Loader.prototype = {
    load: function (template) {
        this._fetchTemplate(template)
            .then(el => this._setTemplate(el))
            .then(() => this.currentTemplate = template)
            .then(() => this._setTitle())
            .then(() => this._dispatchLoadedEvent())
            .catch(err => {
                console.log(err)
                window.location.hash = `#${this.errorTemplate}`
            })
    },

    setListening: function (listening) {
        if (listening && !this._hashListenerRegistered) {
            window.addEventListener('hashchange', this._hashListener, true)
            this._hashListenerRegistered = true

        } else if (!listening && this._hashListenerRegistered) {
            window.removeEventListener('hashchange', this._hashListener, true)
            this._hashListenerRegistered = false
        }
    },

    _getOpts: function (options) {
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
    },

    _onHashChanged: function () {
        const template = window.location.hash.replace('#', '') || this.defaultTemplate
        this.load(template)
    },

    _fetchTemplate: function (template) {
        return fetch(`${this.templatesDir}/${template}.html`)
            .then(data => data.text())
            .then(data => this._parseTemplate(data))
    },

    _parseTemplate: function (templateData) {
        return new Promise(resolve => {
            const templateEl = document.createElement('div')
            templateEl.innerHTML = templateData
            resolve(templateEl.querySelector('template'))
        })
    },

    _setTemplate: function (el) {

        if (this.scrollTop) {
            window.scrollTo({top: 0})
        }

        this._clearNode(this.contentEl)
        this.contentEl.appendChild(el.content.cloneNode(true))
    },

    _clearNode: function (node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild)
        }
    },

    _dispatchLoadedEvent: function () {
        let currentTemplate = this.currentTemplate
        let me = this

        const event = new CustomEvent('templateLoaded', {
            detail: {
                template: currentTemplate,
                source: me
            }
        })

        dispatchEvent(event)
    },

    _setTitle: function () {
        if (this.updateTitle) {
            document.title = `${this.titleBase} | ${this.currentTemplate}`
        }
    }
}

