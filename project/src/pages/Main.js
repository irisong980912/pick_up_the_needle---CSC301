import React from "react"
import GoogleMapReact from "google-map-react";
import app from "./base";
import { IonToggle, IonInfiniteScroll, IonInfiniteScrollContent, IonList, IonFab, IonFabButton, IonCol, IonPage, IonLoading, IonIcon, IonItemGroup, IonModal, IonButton, IonTextarea, IonItem, IonLabel, IonInput, IonContent, IonGrid, IonRow, IonListHeader, IonSearchbar} from '@ionic/react'
import { Plugins, CameraResultType } from '@capacitor/core'
import { defineCustomElements} from '@ionic/pwa-elements/loader'
import refresh_icon from '../images/refresh.png'

const {Camera} = Plugins
const img_placeholder = "https://dm2301files.storage.live.com/y4mhiY9VYUi_VuK-xUIr9P5kn2DFPT8G296RqrInqA6c8w_teunNFKr7txhK5Xcwourl3JV4TwJ-lNrZZtDl2zZcnRrlahQTyvOnNYMOqWJ5eQ4EBtuqPpuN-sdd_giE0Z7nXErPluTf8sknIsHyTb2fvi8D2h1UPAJeRXPK6t8ASASCFohvDISF3VJQrWJVNZ86I0SKOhfqJ6MUHoDgi0UcA/_ionicons_svg_md-photos.svg?psid=1&width=1126&height=2155"

class Main extends React.Component {

    static defaultProps = {
        center: [43.657, -79.401],
        zoom: 15
    }
    /**
     * Define all states and define list of markers to reduce database call.
     * 
     */
    constructor(props) {
        super(props);
        this.database = app.database()

        this.state = {modal_open: false,
            zoomLevel: 15,
            isMobile: false,
            pin: '',
            search_open: false,
            resolve_modal: false,
            detail_modal: false,
            statsOpen: false,
            center: this.props.center,
            text: {'description': '', 'address': '', 'comment': ''},
            photos: [],
            img_url: [''],
            markers: {},
            map: '',
            maps: '',
            search_distance: null,
            loading: false,
            has_geo: false,
            tries: 0,
            go: false,
            actives: {},
            active_load: 0,
            inactive_load: 0}
        defineCustomElements(window)
        this.refreshMap = this.refreshMap.bind(this)
        this.activeTable = {'active': [], 'resolve': []}
    }
    
    componentWillMount() {
        const that = this
        navigator.geolocation.getCurrentPosition((position) => {
            that.props.center[0] = position.coords.latitude
            that.props.center[1] = position.coords.longitude
            that.state.has_geo = true
            that.setState({has_geo: true})
        }, (err) => that.setState({go: true}))
    }

    /* Helper functions  */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /*===================================== Map related helper functions =========================================================
     */

     /**
      * Render the draggable pin on the map with current location gathered from GPS
      */
    renderPin(map, maps) {
        const MARKER_SIZE = 100
        const p = {url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAABmJLR0QA/wD/AP+gvaeTAAAE90lEQVR4nO2dy29UVRjAf+e2lE47pTUQ+lhIC6Q+apRYBYSFsS6kPEwkqUljiDvj3oUxhlWDkRj/AXWhNoikBGOCxI0EiJCIGkoENBaZ1PgaEhFLp/Y197iYDswwfUxn7p3v3PD9klmcnDvn++b85jzuIzOgKIqi3KsY6QSKxT7/QAOx2V0YerB2E9AONM1V38SQwNphjHeSdO0XZujyuFy2xeO8ANvX3oLn7QdeBuqLfFsKy4dU2QFzOJEMMb2ycVaA7d24kkb/DSyvAfESmxkH3sGPvW2GLk8HmF5gOCnA9neuwaaPYu3TATV5Ds/udXE0OCfA9m/swvdPAPcXVMbi0LYB2jqgriHzmpmGC6fh95Glmh7F93aaoatXwsi7VJwSYPs71+DPfANmfV5FbRwe3gLtXeDNk/JkCo5/UEyIUWrMZjP4y/VAEg4ATzqBLPaV7hXY9NGCzm/tgB37YP0j83f+8ljHtD1mezeuLLehoHBGAGP/vFkw5294FLbthuqahd83mYLhU8uJtJ1Vdn8pKYaBE1PQ3FZzhNzdTmsHbN9DQYpjNyBxCZKjkLoF6ZlSQk7hpx8yQ6OJMtIOhGrpBADm9vl3Or82Dlt2kNf5vg8Xz8C1H8D65UZciVf1OvBquQ2Vi/gIsH1dcbz//iRXwOPPZub8LL4PZz+H5K9Bhk7hx1qkz5jl1wBvcje5nR+LZ3Y7uVw8E3TnA9RjJnYG3ehykRdg6Mkrt23I3+2M3chMO6HENj1LHxQu8gIyF9bu0NqeX5+4FMScvwDmsZAaLhp5AdCRV4o35tcmR8OLbO36pQ8KFxcErMor1d513W3iVniRDY1LHxQuLgjIZzbnouVkCmZL2udHBhcEjOWVhk9nOn75Z7jLx/JvuAGWxoUTsQSw5nbpt5HMqxIYc60ygRbGgRFgL4iFNnZYLPYc8gKMd1IuuP1KLnYGeQErxo+TuXVYaVKk674UiJuHuAAzmExh+Ugg9MfS14HAAQEAVNkBIMQNfwFTVNmDFYy3IE4IMIcTSSzvVjDkQfNJIsRT7OJxQgAATfe9hTGnQ49j+Bo/diD0OEUifj8gF/vCg6upmTpfcF84OPSm/GKYz376G79qDxDG9JCAdK9LnQ+OCQAwQ1evMF3TDfZUgM2exbNPmSOjPwbYZiA4JwCyI6HuOTAHgHIeKZzC2gH8WI+LT8WBY2vAfNi+dR1zN9BfovhnRMeBQaqsM7udhXBeQBa7r7meqbpdf23ae6T++s/U3vyD6unMqcNsTQOTTW2k1nbScvHYi9RMnDCDyZRwykURGQFZzp5P2sXqt29ujtRncnINuJdQAcKoAGFUgDAqQBgVIIwKEEYFCKMChFEBwqgAYVSAMCpAGBUgjAoQRgUIowKEUQHCqABhVIAwKkAYFSCMChBGBQijAoRRAcKoAGFUgDAqQBgVIIwKEEYFCKMChFEBwqgAYVSAMCpAGBUgjAoQRgUIowKEUQHCqABhVIAwKkCYyAkwhu9LqXOVyAkA3l+k7r2KZREQkRMwVWcOcfdP3gNYxr109aeVz6g8Iifgma6140BBR1s4tHXr6kIxjhM5AQC+7xVMNdZ6i01NzhKpn/fK5dy3ye+spRsyi++2J5ufkM6pFCI5AubI/cZHbvHNElkBtxfjiC6+WSIrILsYR3XxzeLCn/iUzHyLsaIoiqJEhf8BaydFLvEF73AAAAAASUVORK5CYII=",
            scaledSize: new maps.Size(MARKER_SIZE, MARKER_SIZE),
            origin: new maps.Point(0,0),
            anchor: new maps.Point(MARKER_SIZE/2,MARKER_SIZE)
        }
    
        let pin = new maps.Marker({
            position: {lat: this.props.center[0], lng: this.props.center[1]},
            map: map,
            animation: maps.Animation.DROP,
            draggable: true,
            icon: p
        })
        
        window.curr_lat = this.props.center[0]
        window.curr_lng = this.props.center[1]

        this.setState({'pin': pin})

        maps.event.addListener(pin, 'dragend', (evt) => {
            // alert(evt.latLng.lat().toFixed(3))
            window.curr_lat = evt.latLng.lat().toFixed(6)
            window.curr_lng = evt.latLng.lng().toFixed(6)
        })
    }

    /**
     * Render all active markers. update activeTable for further usage
     * Add infowindow to each marker, render the specific infowindow when there is a marker being selected
     */
    renderNeedles(map, maps) {

        const database = app.database()
        let active = 0
        let inactive = 0
        database.ref('needles').once('value').then(s => {
            const content = s.val()
            
            for (let key in content) {
                const cur = content[key]
                cur["key"] = key
                if (content[key]['is_active']){
                    active = active + 1
                    this.activeTable['active'].push(cur)
                    let marker = new maps.Marker({
                        position: {lat: content[key]['lat'], lng: content[key]['lng']},
                        map: map,
                        title: key.toString()
                    })
                    
                    this.state['markers'][key] = {self: marker}
                    let infowindow_content
                    try {
                        if (content[key]['img_url'][0] !== '') {
                            const imgs = content[key]['img_url'].map((photo) => {
                                return <img src={photo} alt='Needle'/>
                            })
                            infowindow_content = <div><h1>{content[key]['address']}</h1><p>{content[key]['description']}</p>{imgs}</div>
                            
                            
                        } else {
                            infowindow_content = <div><h1>{content[key]['address']}</h1><p>{content[key]['description']}</p> </div>
                        }
                    } catch {
                        infowindow_content = <div>Error, failed to get the data from database. Please reopen the app later.</div>
                    }
                    this.state['markers'][key]['infowindow_content'] = infowindow_content
                    
                    marker.addListener('click', () => {
                        // infowindow.open(map, marker)
                        window.selected_needle = key
                        this.setState({detail_modal: true})
                        
                    })
                } else {
                    inactive = inactive + 1
                    this.activeTable['resolve'].push(cur)
                }
            }
            this.setState({actives: {'active': active, 'inactive': inactive}}) 
        })
    }
    
    /**
     * Remove the marker with given key in marker list
     */
    removeMarker(key) {
        this.state['markers'][key]['self'].setMap(null)
        this.state['markers'][key]['self'] = null
        delete this.state['markers'][key]
    }


    /* Pop up request modal related functions including take picture
     */
    setModal(state) { 
        if (state) {
            const text = this.state['text']
            this.setState({'text': {'description': '', 'address': '', 'comment': text['comment']}})
            this.setState({'img_url': [], 'photos': []})
        }
        this.setState({'modal_open': state, 'zoomLevel': 15})
    }

    
    /**
     * Open stats modal based on state
     * @param {*} state true or false
     */
    statsPage(state) {
        if (window.innerWidth <= 768) {
            this.setState({isMobile: true})
        } else {
            this.setState({isMobile: false})
        }
        this.setState({'statsOpen': state, 'zoomLevel': 15})
    }

    /**
     * Open stats modal based on state
     * @param {*} state true or false
     */
    detailModal(state) {
        this.setState({'detail_modal': state})
    }

    /**
     * this function update description in state['text]: {'description': '', 'address': '', 'comment': ''}
     * @param {*} e target discription input box
     */
    updateInput(e) {
        const text = this.state['text']
        this.setState({'text': {'description': e.target.value, 'address':text['address'], 'comment': text['comment']}})

    }

    /**
     * this function update address in state['text]: {'description': '', 'address': '', 'comment': ''}
     * @param {*} e target address input box
     */
    updateAddr(e) {
        const text = this.state['text']
        this.setState({'text': {'description': text['description'], 'address': e.target.value, 'comment': text['comment']}})
    }
    /**
     * this function update comment in state['text]: {'description': '', 'address': '', 'comment': ''}
     * @param {*} e target comment input box
     */
    updateComment(e) {
        const text = this.state['text']
        this.setState({'text': {'description': text['description'], 'address':text['address'], 'comment': e.target.value}})
    }

    /**
     * This function update distance in states, if user input is not a number, ignore.
     * @param {*} e target search input box
     */
    updateSearchDistance(e) {
        if (isNaN(e.target.value)){
            this.setState({'search_distance': null })
        } else {
            const dist = parseInt(e.target.value, 10)
            this.setState({'search_distance': dist })
        }
            
    }
       
    /**
     * Create a new marker request. Store cooresponding content in to database.
     * key of current item in database is defined as current time in millisecond.
     * Clear page cache on each access.
     * Handle request with and without images seperately.
     * Create info window for the newly submitted request.
     */
    submitRequest() {
        if (this.state.text.description === '' || this.state.text.address === '') {
            alert('please complete the form')
            return
        } 

        this.setState({loading: true})
        const curr_time = new Date().getTime()
        const storage = app.storage()
        const database = this.database

        const that = this
        const lat = Number(window.curr_lat)
        const lng = Number(window.curr_lng)
        const address = this.state['text']['address']
        const description = this.state['text']['description']

        // Handle request without image upload
        if (this.state['photos'].length === 0) {

            database.ref('needles/' + curr_time).set({
                lat: lat,
                lng: lng,
                description: that.state['text']['description'],
                address: that.state['text']['address'],
                img_url: [''],
                is_active: true
            })
            const marker = new that.state.maps.Marker({
                position: {lat: lat, lng: lng},
                map: that.state.map,
                title: curr_time.toString(),
            })
            that.state['markers'][curr_time.toString()] = {self: marker}
            const infowindow_content = <div><h1>{that.state['text']['address']}</h1><p>{that.state['text']['description']}</p></div>
            that.state['markers'][curr_time.toString()]['infowindow_content'] = infowindow_content
            
            marker.addListener('click', () => {
                window.selected_needle = curr_time;
                that.detailModal(true)
            })
            
            that.setState({loading: false})
            that.setModal(false)
            const cur = {"address": address, "description": description, "lat": lat, "lng": lng, "key": curr_time.toString()}
            that.activeTable['active'].push(cur)
            const activeDict = this.state['actives']
            that.setState({actives: {'active': activeDict['active']+1, 'inactive': activeDict['inactive']}})
            that.setState({photos: []})
            that.setState({img_url: []})
            window.selected_needle = -1
            alert("request submitted")
            return
        } else { // Handles request with one or more images.
            const bitmap = []
            for (let i = 0; i < this.state.photos.length; i++) {
                bitmap.push(-1)
            }
            for (let i = 0; i < this.state.photos.length; i++) {
                const ref  = storage.ref("pics/" + curr_time + '_' + i.toString())
                ref.putString(this.state['photos'][i], 'data_url').then(function (snapshot) {
                
                    ref.getDownloadURL().then(url => {
                        that.setState({img_url: [ ...that.state.img_url, url]})
                        
                        bitmap[i] = 0
                    })
        
                })
            }

            /**
             * This function checks if all images are loaded. 
             * Checked in every 3 seconds if not completely loaded
             */
            function checkFlag() {
                if (bitmap.some((c) => c===-1)){
                    window.setTimeout(checkFlag, 3000)
                } else {
                    const imgs = that.state['img_url'].map((photo, index) => {
                        return <img src={photo} alt='Needle'/>
                    })
                    that.state['markers'][curr_time.toString()] = {}
                    const infowindow_content = <div><h1>{that.state['text']['address']}</h1><p>{that.state['text']['description']}</p>{imgs}</div>
                    
                    that.state['markers'][curr_time.toString()]['infowindow_content'] = infowindow_content

                    database.ref('needles/' + curr_time).set({
                        lat: Number(window.curr_lat),
                        lng: Number(window.curr_lng),
                        description: that.state['text']['description'],
                        address: that.state['text']['address'],
                        img_url: that.state.img_url,
                        is_active: true
                    })
                    const marker = new that.state.maps.Marker({
                        position: {lat: Number(window.curr_lat), lng: Number(window.curr_lng)},
                        map: that.state.map,
                        title: curr_time.toString()
                    })
                    marker.addListener('click', () => {
                        window.selected_needle = curr_time;
                        that.setState({detail_modal: true})
                    })
                    
                    that.state['markers'][curr_time]['self'] = marker
                    that.setState({loading: false})
                    that.setModal(false)
                    that.setState({img_url: []})
                    that.setState({photos: []})
                    window.selected_needle = -1
                    alert("request submitted")
                }
            }
            checkFlag()
            const cur = {"address": address, "description": description, "lat": lat, "lng": lng, "key": curr_time.toString()}
            that.activeTable['active'].push(cur)
            const activeDict = that.state['actives']
            
            that.setState({actives: {'active': activeDict['active']+1, 'inactive': activeDict['inactive']}})
        }
    }

    /**
     * User can logout, go back to login page
     */
    logout(){
        localStorage.clear()
        this.setState({statsOpen: false})
        window.location.reload()
        this.props.history.push('/login')
    }

    /**
     * This function filter and display all active needles within the km based on user input.
     * Alert if user input is invalid
     * Click the list item to jump your map to the positon of the selected needle.
     */
    searchNeedles() {
        if (this.state['search_distance'] === null || this.state['search_distance'] === 0){
            alert('Please enter a valid distance')
            return 
        }
        const dist = this.state['search_distance']
        const curr_lat = window.curr_lat
        const curr_lng = window.curr_lng

        const makerRegion = document.querySelector('#selected_markers')
        makerRegion.innerHTML = ''

        for (let i=0; i < this.activeTable['active'].length; i++) {
            const dbcontent = this.activeTable['active'][i]

            const lat = dbcontent.lat
            const lng = dbcontent.lng
            if (this.getDistance(lat, lng, curr_lat, curr_lng) < dist){
                const date = new Date(Number(dbcontent['key']))
                const item = document.createElement('ion-item');
                
                item.innerHTML = `
                <IonLabel lines="full"><h2>${dbcontent['address']}</h2>
                <p style="color:grey;"> Description: <b>${dbcontent['description']}</b></p>
                <p style="color:grey;"> Latitude, Longitude: <b>${dbcontent['lat']}, ${dbcontent['lng']}</b></p>
                <p style="color:grey;"> Marker Found Time: <b>${date.toLocaleString('en-US')}</b></p>
                </IonLabel>
                <IonNote slot="end"><u><i style="color:gray;">Click to view</i></u></IonNote>
                `
                item.onclick = () => {this.jumpToNeedle(lat, lng, dbcontent['key']); this.setState({'search_open': false})}
                
                makerRegion.append(item)
            }
        }
        
    }

    /**
     * Jump your map to location (lat, long), and change the zoom level of map.
     * @param {*} lat latitude
     * @param {*} lon longitude
     * @param {*} key selected needles key
     */
    jumpToNeedle(lat, lon, key) {
        this.state.center = [lat, lon]
        this.setState({zoomLevel: 20})
        this.state.pin.setPosition( new this.state.maps.LatLng(lat, lon))
        window.selected_needle = key
        
    }

    /**
     * Convert degree difference to KM
     * Calculate the distance between your current location and selected needle in KM
     * @param {*} lat1 current location latitude
     * @param {*} lon1 current location longitude
     * @param {*} lat2 select marker's latitude
     * @param {*} lon2 select marker's longitude
     */
    getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371
        const dLat = this.degreeToRadius(lat2 - lat1)
        const dLon = this.degreeToRadius(lon2 - lon1)
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.degreeToRadius(lat1)) * Math.cos(this.degreeToRadius(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        return R * c
    }


    degreeToRadius(degree) {
        return degree * (Math.PI / 180)
    }

    /**
     * reset Search page when user close the modal
     */
    resetSearch(){
        const distanceInput = document.querySelector('#search_distance')
        distanceInput.value = ''
        const needleList = document.querySelector("#selected_markers")
        needleList.innerHTML = ''
    }

    /*
    This function update the needle status is_active to false and remove from the list of markers that will be rendered
    */
   resolveRequest() {
    if ('selected_needle' in window) {
        this.setState({loading: true})
        const selected = window.selected_needle.toString()

        const resolve_time = new Date().getTime()
        // update the current resolved marker's status
        this.database.ref('needles/'+ selected).update({
            is_active: false,
            comments: this.state['text']['comment'],
            resolved_time: resolve_time
        })
        
        this.state['markers'][selected]['self'].setMap(null)
        this.state['markers'][selected]['self'] = null
        delete this.state['markers'][window.selected_needle]

        const wanted =  this.activeTable['active'].filter(each => each['key'] === selected)
        wanted[0]['resolved_time'] = resolve_time
        wanted[0]['comments'] = this.state['text']['comment']
        
        this.activeTable['active'] = this.activeTable['active'].filter(each => each['key'] !== selected)
        this.activeTable['resolve'].push(wanted[0])
        
        const activeDict = this.state['actives']
        this.setState({actives: {'active': activeDict['active']-1, 'inactive': activeDict['inactive']+1}})

        this.setState({loading: false})
        this.detailModal(false)
        window.selected_needle = -1
        alert('successfully resolved')
        this.setState({'text': {'description': '', 'address': '', 'comment': ''}})
    } else {
        alert("No needle selected.")
    }
    
    }

    /**
     * Clear all resolved needles in the database
     */
    clearDB(){

        const database = app.database()
        const storage = app.storage()
        // for each needle in the database if it is not active, remove it from the list and from db
        database.ref('needles').once('value').then(s => {
            const content = s.val()
            for (let key in content) {
                if (!content[key]['is_active']){

                    database.ref('needles/' + key).remove()
                    if (content[key]['img_url'].length !== 0) {
                        for (let i = 0; i < content[key]['img_url'].length; i++){
                            storage.ref('pics/' + key + '_' + i.toString()).delete()
                        }
                    }
                    
                }
            }
        })
        
        this.setState({statsOpen: false})
        this.setState({actives: {'active': this.state['actives']['active'], 'inactive': 0}}) 
        this.activeTable['resolve'] = []
        this.refreshMap()
        alert('successfully cleared')
    }    

    searchPage(){
        if (window.innerWidth <= 768) {
            this.setState({isMobile: true})
        } else {
            this.setState({isMobile: false})
        }
        this.setState({'search_open':true, 'zoomLevel': 15})
    }

    // ----------------------- Starts Stats Functions -----------------------

    /**
     * This function clear all loaded resolved and unresolved markers and reset stats page to only display
     * the number of both category when backarrow or close icon is clicked in stats page.
     */
    resetStats() {
        const activeRegion = document.querySelector('#active_markers')
        const activeList = document.querySelector("#activeList")
        const inactiveList = document.querySelector("#inactiveList")
        const inactiveRegion = document.querySelector('#resolved_markers')
        const backArrow = document.querySelector('#backArrow')
        const infiniteScroll = document.getElementById('infinite-scroll')
        const searchbar = document.querySelector('#searchbar')
        const searchAll = document.querySelector('#searchAll')
        infiniteScroll.disabled = true;

        
        // clear inavtive data if there is previous loaded records, be sure to add first 2 element back
        inactiveList.innerHTML = ''
        
        // hide back arrow
        backArrow.style.visibility = 'hidden'

        // clear active data
        activeList.innerHTML = ''

        searchbar.style.display = 'none'
        searchAll.style.display = 'none'
        searchAll.checked = false
        document.querySelector('#searchbar > div > input').value = ''

        activeRegion.style.display = 'block'
        inactiveRegion.style.display = 'block'

        this.setState({'active_load': 0, 'inactive_load': 0})

    }

    
    /**
     * This function hide resolve info and display information of all markers that are waiting to be resolved
     * Information includes: Marker Address, Marker discription, Marker position in (Lat, Long), Marker Found Time.
     * 
     */
    showUnresolvedMarkers(number){
        const activeList = document.querySelector("#activeList")
        // add all active record into active region
        const oldLoad = this.state['active_load']
        for (let i=0; i<number && i+oldLoad+1 <= this.activeTable['active'].length; i++) {
            const dbcontent = this.activeTable['active'][i+oldLoad]
            const date = new Date(Number(dbcontent['key']))
            const item = document.createElement('ion-item');
            
            item.innerHTML = `
            <IonLabel><h2>${dbcontent['address']}</h2>
            <p style="color:grey;"> Description: <b>${dbcontent['description']}</b></p>
            <p style="color:grey;"> Latitude, Longitude: <b>${dbcontent['lat']}, ${dbcontent['lng']}</b></p>
            <p style="color:grey;"> Marker Found Time: <b>${date.toLocaleString('en-US')}</b></p>
            </IonLabel>
            <IonNote slot="end"><u><i style="color:gray;">Click to view</i></u></IonNote>
            `
            item.onclick = () => {this.jumpToNeedle(dbcontent['lat'], dbcontent['lng'], dbcontent['key']);this.setState({statsOpen: false})}
            activeList.append(item)
            this.setState({'active_load': oldLoad + i + 1})
        }
        
    }

    /**
     * Bind for Lazy loading
     */
    wait(time) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve();
          }, time);
        });
    }

    /**
     * Initiate event handler for unresolved marker information list of lazy loading and dynamic
     *  search function
     */
    infiniteScrollHandlerUnresolve() {
        const that = this
        const activeRegion = document.querySelector('#active_markers')
        const activeList = document.querySelector("#activeList")
        const inactiveRegion = document.querySelector('#resolved_markers')
        const backArrow = document.querySelector('#backArrow')
        const searchAll = document.querySelector('#searchAll')
        // hide inactive region, show active region
        inactiveRegion.style.display = 'none'
        activeRegion.style.display = 'block'
        backArrow.style.visibility = 'visible'

        const searchbar = document.querySelector('#searchbar');
        searchbar.style.display = 'block'
        searchbar.addEventListener('ionInput', handleInput);
        searchAll.style.display = 'block'
        
        // handleing lazy loading
        that.showUnresolvedMarkers(5);
        let markers = Array.from(activeList.children)

        const infiniteScroll = document.getElementById('infinite-scroll');
        infiniteScroll.disabled = false;
        infiniteScroll.addEventListener('ionInfinite', async function () {
            if (that.state['active_load'] < that.activeTable['active'].length) {
                await that.wait(500);
                infiniteScroll.complete();
                that.showUnresolvedMarkers(5);
                markers = Array.from(activeList.children)
            } else {
                infiniteScroll.disabled = true;
            }
        })
        
        // Handling dynamic search
        function handleInput(event) {
            const query = event.target.value.toString().toLowerCase();
            if (searchAll.checked) {
                that.showUnresolvedMarkers(that.activeTable['active'].length)
                infiniteScroll.disabled = true;
                markers = Array.from(activeList.children)
            }
            requestAnimationFrame(() => {
                markers.forEach(item => {
                    const shouldShow = item.children[0].children[0].textContent.toLowerCase().indexOf(query) > -1;
                    item.style.display = shouldShow ? 'block' : 'none';
                });
            });
        }
    }

    /**
     * Initiate event handler for all resolved marker information list of lazy loading and dynamic
     * search function
     */
    infiniteScrollHandlerResolve() {
        const that = this
        const activeRegion = document.querySelector('#active_markers')
        const inactiveRegion = document.querySelector('#resolved_markers')
        const backArrow = document.querySelector('#backArrow')
        const inactiveList = document.querySelector("#inactiveList")
        const searchAll = document.querySelector('#searchAll')
        
        // hide active region, show inactive region
        activeRegion.style.display = 'none'
        inactiveRegion.style.display = 'block'
        // show back arrow
        backArrow.style.visibility = 'visible'

        const searchbar = document.querySelector('#searchbar');
        searchbar.style.display = 'block'
        searchAll.style.display = 'block'
        searchbar.addEventListener('ionInput', handleInput);
        

        that.showResolvedMarkers(5);
        let markers = Array.from(inactiveList.children)

        const infiniteScroll = document.getElementById('infinite-scroll');
        infiniteScroll.disabled = false;
        infiniteScroll.addEventListener('ionInfinite', async function () {
            if (that.state['active_load'] < that.activeTable['active'].length) {
                await that.wait(500);
                infiniteScroll.complete();
                that.showResolvedMarkers(5);
                markers = Array.from(inactiveList.children)

            } else {

                infiniteScroll.disabled = true;
            }
        })

        
        function handleInput(event) {
            const query = event.target.value.toString().toLowerCase();
            if (searchAll.checked) {
                that.showResolvedMarkers(that.activeTable['resolve'].length)
                infiniteScroll.disabled = true;
                markers = Array.from(inactiveList.children)
            }
            requestAnimationFrame(() => {
                markers.forEach(item => {
                    const shouldShow = item.children[0].children[0].textContent.toLowerCase().indexOf(query) > -1;
                    item.style.display = shouldShow ? 'block' : 'none';
                });
            });
        }
        
    }

    /**
     * This function hide the active region
     * Then list all resolved markers with its information: Address, position in (lat, long), maker placed time,
     * marker resolved time, total time it took to reolve this marker, and any comment if the resolve person left.
     * This function is basically the reverse version of showUnresolvedMarkers
     */
    showResolvedMarkers(number){
        const inactiveList = document.querySelector("#inactiveList")

        const oldLoad = this.state['inactive_load']
        for (let i=0; i<number && i+oldLoad+1 <= this.activeTable['resolve'].length; i++) {
            const dbcontent = this.activeTable['resolve'][i+oldLoad]
            const foundDate = new Date(Number(dbcontent['key']))
            const resolveDate = new Date(Number(dbcontent['resolved_time']))
            const item = document.createElement('ion-item');
            item.innerHTML = `
                <IonLabel lines="full"><h2>${dbcontent['address']}</h2>
                <p style="color:grey;"> Description: <b>${dbcontent['description']}</b></p>
                <p style="color:grey;"> Latitude, Longitude: <b>${dbcontent['lat']}, ${dbcontent['lng']}</b></p>
                <p style="color:grey;"> Marker Found Time: <b>${foundDate.toLocaleString('en-US')}</b></p>
                <p style="color:grey;"> Marker Resolve Time: <b>${resolveDate.toLocaleString('en-US')}</b></p>
                <p style="color:grey;"> Total Time Last: <b>${this.timeConversion(resolveDate - foundDate)}</b></p>
                <p style="color:grey;"> Optional Resolve Comment: <b>${dbcontent['comments']}</b></p>
                </IonLabel>
                `
            inactiveList.append(item)
            this.setState({'inactive_load': oldLoad + i + 1})
        }
        
    }

    /**
     * This function convers millisecond to minute or hours or days depends on the length of the time input
     * @param {*} millisec number of millisecond
     */
    timeConversion(millisec) {

        var seconds = (millisec / 1000).toFixed(1);

        var minutes = (millisec / (1000 * 60)).toFixed(1);

        var hours = (millisec / (1000 * 60 * 60)).toFixed(1);

        var days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1);

        if (seconds < 60) {
            return seconds + " Sec";
        } else if (minutes < 60) {
            return minutes + " Min";
        } else if (hours < 24) {
            return hours + " Hrs";
        } else {
            return days + " Days"
        }
    }

    // ------------------Ends function of stats page -----------------------

    /**
     * Allow user to take pictures
     */
    async takePicture() {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.DataUrl
            });
            
            const data = image.dataUrl
        
            this.setState({photos: [ ...this.state.photos, data]})
        } catch (err) {
            console.log("User canceled taking the picture.")
            return
        }
       
    }

    /**
     * Refresh pin and needles in the map
     */
    refreshMap() {
        for (const [key, value] of Object.entries(this.state.markers)) {
            this.removeMarker(key)
        }
        this.renderNeedles(this.state.map, this.state.maps)
    }

    /**
     * Render page
     */
    render() {
        const handleApiLoaded = (map, maps) => {
            this.renderPin(map, maps)
            this.renderNeedles(map, maps)
            this.setState({map: map, maps: maps})
            
        }
        const img_style = {
            'maxWidth': '100px',
            'marginLeft': '2vw'
        }

        const is_mobile = this.state['isMobile']
        
        if (!this.state.has_geo && !this.state.go) {
            return null;
        }
        return (
            <IonPage>
                <div style={{ flex: 95, width: '100%' }}>
                    <GoogleMapReact
                        // bootstrapURLKeys={{ key: process.env.REACT_APP_MAPS_KEY}}
                        defaultCenter={this.props.center}
                        center={this.state.center}
                        zoom={this.state.zoomLevel}
                        yesIWantToUseGoogleMapApiInternals
                        onGoogleApiLoaded={({ map, maps }) => handleApiLoaded(map, maps)}
                    >
                    </GoogleMapReact>
                </div>

                <IonFab vertical="top" horizontal="start" slot="fixed">
                    <IonFabButton onClick={this.refreshMap}>
                        <img src={refresh_icon} />
                    </IonFabButton>
                </IonFab>


                <div style={{ flex: 5, width: '100%' }}>
                    {/* Needle detail modal */}
                    <IonModal backdropDismiss={false} isOpen={this.state['detail_modal']}>
                        
                        <IonItemGroup style={{height: '80%'}}>
                        
                            <IonItem>
                                <IonIcon onClick={() => this.detailModal(false)} name="close" size='large' slot="end" ></IonIcon>
                            </IonItem>
                            <div style={{overflow:'scroll', height:'95%', overflowx:'hidden'}}>
                            <IonItem>          
                                {('selected_needle' in window) && window.selected_needle !== -1 && this.state['markers'][window.selected_needle.toString()]['infowindow_content']}
                            </IonItem>
                            <IonItem>
                                <IonLabel position="stacked">Optional Comments on the Resolved Needle</IonLabel>
                                <IonTextarea id='comment' value={this.state.text.comment} onInput={(e) => this.updateComment(e)} rows={6} placeholder="Enter your comment here..." clearOnEdit></IonTextarea>
                            </IonItem>
                            </div>
                        </IonItemGroup>
                        <div style={{height: '15%'}}>
                            
                            <IonButton fill='clear' color='medium' expand="block" onClick={() => this.detailModal(false)}>Cancel</IonButton>
                            <IonButton expand="block" onClick={() => this.resolveRequest()}>Resolve Needle</IonButton>
                        </div>
                    </IonModal>
                    {/* Submit Request Modal */}
                    <IonModal backdropDismiss={false} isOpen={this.state['modal_open']}>
                        <IonItemGroup>
                            <IonItem>
                                <IonIcon onClick={() => this.setModal(false)} name="close" size='large' slot="end" ></IonIcon>
                            </IonItem>
                            <IonItem>
                                <IonLabel position="stacked">Plearse Enter Your Current Address.</IonLabel>
                                <ion-input id='address' value={this.state.text.address} onInput={(e) => this.updateAddr(e)} placeholder="Enter your address here..." clearOnEdit></ion-input>
                            </IonItem>
                            <IonItem>
                                <IonLabel position="stacked">Please Enter More Details.</IonLabel>
                                <IonTextarea id='description' value={this.state.text.description} onInput={(e) => this.updateInput(e)} rows={6} placeholder="Enter more information here..." clearOnEdit></IonTextarea>
                            </IonItem>
                            <IonItem>
                                <img src={img_placeholder} alt='Needle' style={{maxWidth:'20px'}}/>
                                <IonButton color="primary" onClick={() => this.takePicture()}>Add Photo</IonButton>
                                <div style={{overflow: 'scroll'}}>
                                {this.state['photos'].map((photo) => {
                                    return <img src={photo} alt='Needle' style={img_style}/>
                                })}</div>
                            </IonItem>
                        </IonItemGroup>
                        <div>
                            
                            <IonButton fill='clear' color='medium' expand="block" onClick={() => this.setModal(false)}>Cancel</IonButton>
                            <IonButton expand="block" onClick={() => this.submitRequest()}>Submit Request</IonButton>
                        </div>

                        <IonLoading
                            isOpen={this.state['loading']}
                            onDidDismiss={() => this.setState({loading: false})}
                            message={'Uploading...'}
                        />
                    </IonModal>

                    {/* stats modal */}
                    <IonModal backdropDismiss={false} isOpen={this.state['statsOpen']}>

                        <IonItemGroup>
                            <IonItem>
                            <ion-icon id='backArrow' name="arrow-back" size='large' onClick={() => this.resetStats()} style={{visibility: 'hidden'}}></ion-icon><IonIcon onClick={() => {this.statsPage(false); this.resetStats()}} name="close" size='large' slot="end" ></IonIcon>
                            </IonItem>
                            
                            <IonSearchbar ionBlur id='searchbar' placeholder="Search Address In Loaded Markers" style={{display: 'none'}}></IonSearchbar>
                            <IonToggle id="searchAll" color="primary" style={{display: 'none', float: 'right'}} />
                            <IonContent scroll='true' style={{height: is_mobile ? '60vh' : '45vh'}}>
                                <IonList id='active_markers'>
                                    <IonListHeader>Active Markers:</IonListHeader>
                                    <IonLabel class="ion-text-center">There are <b>{this.state['actives']['active']}</b> markers waiting to be resolved.</IonLabel>
                                    <IonList id="activeList"></IonList>
                                </IonList>
        
                                <IonList id='resolved_markers'>
                                    <IonListHeader>Resolved Markers:</IonListHeader>
                                    <IonLabel class="ion-text-center">There are <b>{this.state['actives']['inactive']}</b> markers have been resolved.</IonLabel>
                                    <IonList id="inactiveList"></IonList>
                                </IonList>

                            <IonInfiniteScroll threshold="100px" id="infinite-scroll">
                                <IonInfiniteScrollContent loading-spinner="bubbles" loading-text="Loading more data...">
                                </IonInfiniteScrollContent>
                            </IonInfiniteScroll>
                                                         
                            </IonContent>   
                        </IonItemGroup>
                    
                        <div>
                            
                            <IonGrid>
                            
                             <IonRow>
                                <IonCol>
                                    <IonButton expand="block" onClick={() => this.infiniteScrollHandlerUnresolve()}>Unresolved</IonButton>
                                </IonCol>
                                <IonCol>
                                    <IonButton expand="block" onClick={() => this.infiniteScrollHandlerResolve()}>Resolved</IonButton>
                                </IonCol>
                                {localStorage.getItem('email') && localStorage.getItem('email').endsWith('@admin.com') && 
                                <IonCol>
                                    <IonButton color="warning" expand="block" onClick={() => this.clearDB()}>Clear</IonButton>
                                </IonCol>}
                                <IonCol>
                                    <IonButton expand="block" color="danger" onClick={() => this.logout()}>Log Out</IonButton>
                                </IonCol>
                                
                            </IonRow>
                            </IonGrid>
                        </div>

                        <IonLoading
                            isOpen={this.state['loading']}
                            onDidDismiss={() => this.setState({loading: false})}
                            message={'Uploading...'}
                        />

                    </IonModal>
                    
                    {/* search modal */}
                    <IonModal backdropDismiss={false} isOpen={this.state['search_open']}>
                        <IonItemGroup>
                            <IonItem>
                                <IonIcon onClick={() => {this.resetSearch(); this.setState({'search_open': false})}} name="close" size='large' slot="end" ></IonIcon>
                            </IonItem>
                            <IonItem>
                                <IonLabel position="stacked">Please enter the radius in KM that you want to search</IonLabel>
                                <IonInput id='search_distance' onInput={(e) => this.updateSearchDistance(e)} rows={6} placeholder="Enter your distance in KM here" clearOnEdit></IonInput>
                            </IonItem>
                            <IonContent scroll='true' style={{height: is_mobile ? '72vh' : '45vh'}}>
                                <IonList id='searched_needles'>
                                    <IonListHeader>All Needles Within Radius:</IonListHeader>
                                    <IonList id="selected_markers"></IonList>
                                </IonList>
                        
                            </IonContent>   
                        </IonItemGroup>
                        
                        <div>
                            <IonButton expand="block" onClick={() => this.searchNeedles()}>Search</IonButton>
                        </div>
                        <IonLoading
                            isOpen={this.state['loading']}
                            onDidDismiss={() => this.setState({loading: false})}
                            message={'Uploading...'}
                        />
                    </IonModal>    
                                        
                    <IonGrid >
                    <IonRow>
                    <ion-button color="primary" expand="block" onClick={() => this.setModal(true)} style={{flex:1}}>Request</ion-button>
                    <ion-button color="secondary" expand="block" onClick={() => this.statsPage(true)} style={{flex:1}}>More Information</ion-button>
                    <ion-button color="tertiary" expand="block" onClick={() => this.searchPage()} style={{flex:1}}>Search Needles</ion-button>

                    </IonRow>
                    
                    </IonGrid>
                </div>
            </IonPage>
        )
    }
}


export default Main