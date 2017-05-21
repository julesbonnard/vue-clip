export default class DropzoneFile {
    constructor(...data) {
        Object.assign(this, this.constructor.defaults(), ...data)
    }

    set(...data) {
        Object.assign(this, ...data)
        return this
    }

    setDeepProps(...data) {
        const deepData = data.map(obj => {
            let newData = {}

            for (let prop in obj) {
                if (typeof obj[prop] !== 'function') {
                    newData[prop] = obj[prop]
                }
            }

            return newData
        })

        return this.set(...deepData)
    }

    static defaults() {
        return {
            id: undefined,
            accepted: undefined,
            height: undefined,
            lastModified: undefined,
            lastModifiedDate: undefined,
            name: undefined,
            previewElement: undefined,
            previewTemplate: undefined,
            processing: undefined,
            size: undefined,
            status: undefined,
            type: undefined,
            upload: undefined,
            webkitRelativePath: undefined,
            width: undefined,
            xhr: undefined,
            dataUrl: '',
            errorMessage: ''
        }
    }

}
