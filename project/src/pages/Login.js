import React from "react"
import {withRouter} from 'react-router-dom'
import {IonCard, IonPage, IonContent, IonLoading} from "@ionic/react"
import app from "./base";
import {alertController} from "@ionic/core";
import login_icon from '../images/login.png'

class Login extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this)
        this.handleChange = this.handleChange.bind(this)
        this.handleKey = this.handleKey.bind(this)
        this.state = {email: '', password: '', loading: false}
        navigator.geolocation.getCurrentPosition(() => {
        })
    }

    render() {
        const my_style = {
            textAlign: 'center',
            // paddingTop: '20%',
            background: 'linear-gradient(120deg, #30cfd0 0%, #ba91e0 100%)',
            minHeight: '100%',
            textColor: 'white'
        }

        const header_style = {
            // marginTop: '7vh',
            fontSize: '50px',
            color: 'white',
            // textShadow: '2px 2px 10px white',
            // maxWidth: '60vh',
            maxHeight: '15vh'
        }

        const header2_style = {
            fontSize: '20px',
            textAlign: 'center',
            color: 'white',
        }

        const form_style = {
            height: '70vh',
            width: '60%',
            textAlign: 'center',
            marginTop: '20vh',
            marginBottom: '10vh',
            marginLeft: '20%',
            color: 'primary'
        }

        const input_style = {
            textAlign: 'center',
            margin: '15px',
            borderRadius: '300px',
        }

        const button_style = {
            marginTop: '5%',
            width: '40%',
            height: '45px',
            marginLeft: '30%',
        }
        return (
            
            <IonPage>
                <IonLoading
                                isOpen={this.state['loading']}
                                onDidDismiss={() => this.setState({loading: false})}
                                message={'Signing in'}
                            />
                <div style={my_style}>
                    <form id="loginform" style={form_style} onSubmit={this.handleSubmit}>
                        {/* <h1 style={header_style}>Login</h1> */}
                        <div><img style={header_style} src={login_icon} /> </div>
                        <h1 style={header2_style}>Email</h1>
                        <ion-item style={input_style}>
                            <ion-input name="email" type="email" placeholder="your@email.com" onInput={this.handleChange}
                                       required></ion-input>
                        </ion-item>
                        <h1 style={header2_style}>Password</h1>
                        <ion-item style={input_style}>
                            {/* <ion-label position="stacked">Password</ion-label> */}
                            <ion-input name="password" type="password" placeholder="Password" onInput={this.handleChange} onKeyDown={this.handleKey} clearOnEdit></ion-input>
                        </ion-item>
                        <div class="ion-padding">
                            <ion-button style={button_style} expand="block" class="ion-no-margin" type='submit'>Login
                            </ion-button>
                        </div>
                    </form>
                </div>
            </IonPage>
        )
    }

    /* Enter to trigger login */
    handleKey(e) {
        if (e.keyCode == 13) {
            const dummy = {preventDefault: () => {}}
            this.handleSubmit(dummy)
        }
    }

    handleChange(e) {
        // Credit to Daniel Ruf
        const stateObject = function() {
            const returnObj = {};
            returnObj[this.target.name] = this.target.value;
               return returnObj;
          }.bind(e)();

        this.setState(stateObject)
        
        // alert(e.target.name)
    }
    
    handleSubmit = (e) => {
        const that = this
        this.setState({loading: true})
        e.preventDefault()
        try {
            app.auth().signInWithEmailAndPassword(this.state.email, this.state.password)
                .then(res => {
                    // successfully login
                    // that.props.history.push('/main')
                    // save something into local storage
                    localStorage.setItem("hasLogin", true)
                    localStorage.setItem("email", that.state.email)
                    document.getElementById("loginform").reset()
                    that.setState({loading: false})
                    window.location.reload('')
                    
                })
                .catch(err => {
                    that.setState({loading: false})
                    alert(err.message)
                })
            // this.props.history.push('/main')
        } catch (e) {
            alert(e.message)
        }

    }
}

export default withRouter(Login)