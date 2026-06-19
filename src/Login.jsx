import { Component } from 'react';
import { api } from './api.js';
import LoginView from './LoginView.jsx';

export default class Login extends Component {
  state = {
    username: '',
    password: '',
    error: '',
    loading: false,
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password } = this.state;
    const { onLogin } = this.props;
    if (!username.trim() || !password) {
      this.setState({ error: 'Enter username and password.' });
      return;
    }
    this.setState({ error: '', loading: true });
    try {
      const { user } = await api.login(username, password);
      onLogin(user);
    } catch (err) {
      this.setState({ error: err.message || 'Login failed.' });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { username, password, error, loading } = this.state;

    return (
      <LoginView
        username={username}
        password={password}
        error={error}
        loading={loading}
        onSubmit={this.handleSubmit}
        onUsernameChange={(e) => this.setState({ username: e.target.value })}
        onPasswordChange={(e) => this.setState({ password: e.target.value })}
      />
    );
  }
}
