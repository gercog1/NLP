import React, { Component } from 'react';
import Pusher from 'pusher-js';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userMessage: '',
      conversation: [],
    };
  }

  componentDidMount() {
    const pusher = new Pusher('4247e7dc8a1ba04e9fb9', {
      cluster: 'eu',
      encrypted: true,
    });

    const channel = pusher.subscribe('bot');
    channel.bind('bot-response', data => {
      const msg = {
        text: data.message,
        user: 'ai',
          filmData: data.filmData,
      };
      this.setState({
        conversation: [...this.state.conversation, msg],
      });
    });
  }

  handleChange = event => {
    this.setState({ userMessage: event.target.value });
  };

  handleSubmit = event => {
    event.preventDefault();
    if (!this.state.userMessage.trim()) return;

    const msg = {
      text: this.state.userMessage,
      user: 'human',
    };

    this.setState({
      conversation: [...this.state.conversation, msg],
    });

    fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: this.state.userMessage,
      }),
    });

    this.setState({ userMessage: '' });
  };


  render() {
      const chat = this.state.conversation.map((e, index) =>
        <div key={`${e.user}-${index}`} className={`${e.user} chat-bubble`}>
          <span className="chat-content">{e.text} <br/>
              { e.filmData && e.user === 'ai' && <a href={e.filmData.url}>
                  {e.filmData.name}<br/>
                  <img alt={index} src={e.filmData.imgUrl} />
                  </a> }
          </span>
        </div>
    );


    return (
      <div className="container">
        <div className="chat-window">
          <div className="conversation-view">{chat}</div>
          <div className="message-box">
            <form onSubmit={this.handleSubmit}>
              <input
                value={this.state.userMessage}
                onInput={this.handleChange}
                className="text-input"
                type="text"
                autoFocus
                placeholder="Type your message and hit Enter to send"
              />
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
