import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,

} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import Login from './pages/Login'
import Main from './pages/Main';
/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

class App extends React.Component {
  
  
  constructor(props) {
    super(props)


  }

  // need to add session cookie
  render() {
    const hasLogin = localStorage.getItem('hasLogin')
    // check if the user has logined
    if (hasLogin === null) {
        return (<IonApp>
          <IonReactRouter>
            <IonRouterOutlet>
              <Route path="/login" component={Login} />
              <Route path="/" render={() => <Redirect to="/login" />} />
            </IonRouterOutlet>
          </IonReactRouter>
        </IonApp>)
    }
    if (hasLogin) {
      return (<IonApp>
        <IonReactRouter>
          <IonRouterOutlet>
           
            <Route path="/main" component={Main} />
            <Route path="/" render={() => <Redirect to="/main" />} />
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>)
    } 

    
  //   return (<IonApp>
  //     <IonReactRouter>
  //       <IonRouterOutlet>
  //         <Route path="/login" component={Login} />
  //         <Route path="/main" component={Main} />
  //         <Route exact path="/" render={() => <Redirect to="/login" />} />
  //       </IonRouterOutlet>
  //     </IonReactRouter>

  //   </IonApp>)
  }
}
// const App: React.FC = () => (
//   <IonApp>
//     <IonReactRouter>
//       <IonRouterOutlet>
//         <Route path="/login" component={Login} />
//         <Route path="/main" component={Main} />
//         <Route exact path="/" render={() => <Redirect to="/login" />} />
//       </IonRouterOutlet>
//     </IonReactRouter>

//   </IonApp>
// );

export default App;
