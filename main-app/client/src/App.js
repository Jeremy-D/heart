import React, { Component } from 'react'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'
import jwtDecode from 'jwt-decode'
import CssBaseline from '@material-ui/core/CssBaseline'
import { MuiThemeProvider } from '@material-ui/core/styles'

import theme from './theme'
import NavBar from './components/Navbar/navbar'
import ParticipantProfile from './components/Participant/Profile'
import LoginPage from './components/Authorization/loginPage'
import { UserAuth } from './utilities/auth'
import Intake from './components/Form/Intake'
import { NoMatch } from './routes/NoMatch'
// Higher Order Component (HOC) to prevent the users from accessing a route if they are not logged in
import { PrivateRoute } from '../src/routes/privateRoute'

import ParticipantsList from './components/ParticipantsList/ParticipantsList'

import './App.css'

const UserContext = React.createContext({
  user: null,
  onLogout: () => true,
})
export const UserConsumer = UserContext.Consumer
const UserProvider = UserContext.Provider

class App extends Component {
  state = {
    user: null,
  }

  decodeToken = authToken => {
    const user = jwtDecode(authToken)
    this.setState({ user })
  }

  componentWillUnmount() {
    this.stopPeriodicRefresh()
  }

  componentWillMount() {
    const authToken = localStorage.getItem('authToken')
    if (authToken === 'undefined') {
      console.log('authToken is undefined')
      // If for some reason authToken is undefined log the user out.
      UserAuth.logout()
      return
    }
    if (authToken) {
      this.decodeToken(authToken)
      this.startPeriodicRefresh()
    }
  }

  handleNewLogin = authToken => {
    UserAuth.setAuthToken(authToken)
    this.decodeToken(authToken)
    this.startPeriodicRefresh()
  }

  handleLogout = () => {
    UserAuth.logout()
    this.setState({ user: null })
    this.stopPeriodicRefresh()
  }

  startPeriodicRefresh() {
    this.refreshInterval = setInterval(
      () => {
        UserAuth.refreshAuthToken()
      },
      60 * 60 * 1000 // One hour
    )
  }

  stopPeriodicRefresh() {
    if (!this.refreshInterval) {
      return
    }

    clearInterval(this.refreshInterval)
  }

  render() {
    const { user } = this.state
    return (
      <React.Fragment>
        <CssBaseline />
        <MuiThemeProvider theme={theme}>
          <UserProvider
            value={{
              user,
              onLogout: this.handleLogout,
            }}
          >
            <BrowserRouter>
              <div>
                <header>
                  <NavBar onLogout={this.handleLogout} />
                </header>
                <main>
                  <Switch>
                    <Route
                      path="/login"
                      render={({ location }) => (
                        <LoginPage
                          location={location}
                          onNewLogin={this.handleNewLogin}
                        />
                      )}
                    />
                    <PrivateRoute
                      exact={true}
                      path="/"
                      component={ParticipantsList}
                    />
                    <PrivateRoute
                      exact={true}
                      path="/participants/:id/"
                      component={ParticipantProfile}
                    />
                    {/* hold off on making this route privat */}
                    <Route exact={true} path="/form" component={Intake} />
                    <Redirect from="/" to="/login" />
                    <Route component={NoMatch} />
                  </Switch>
                </main>
              </div>
            </BrowserRouter>
          </UserProvider>
        </MuiThemeProvider>
      </React.Fragment>
    )
  }
}

export default App
