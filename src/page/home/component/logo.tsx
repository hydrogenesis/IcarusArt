import React from 'react';

export class HEADLOGO extends React.Component {
  constructor(props: object) {
    super(props);
    this.state = {
      aname: ''
    };
  }
  componentDidMount() {
    document.querySelector('body').onscroll = (value) => {
      if (
        document.documentElement.scrollTop > 50 ||
        document.body.scrollTop > 50
      ) {
        this.setState(() => {
          return { aname: 'logo-hidden' };
        });
      } else {
        this.setState(() => {
          return { aname: '' };
        });
      }
    };
  }
  state: {
    aname: '';
  };
  render() {
    return (
      <div id="head-logo" className={this.state.aname}>
        Icarus.Ai
      </div>
    );
  }
}
