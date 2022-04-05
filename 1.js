import React from 'react';
import { Button, Modal, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import { DEV_SERVER, SERVER_PORT } from '../../constants/API/config';
import { THREAD } from '../../constants/API';
import { getHeader } from '../../actions/header';

/* задать вопрос эксперту, можно отправить свою фотографию */

const API_URL = `${DEV_SERVER}:${SERVER_PORT}${THREAD}`;

export default class ChatModal extends React.Component<Props> {
  state = {
    message: '',
    threadId: null,
    alertMessage: '',
    photo: null,
    showAlert: false,
  };

  /* обработчики сообщения и фотографии */

  handleMessage = e => {
    this.setState({
      message: e.target.value
    });
  };

  handlePhoto = e => {
    const photo = e.target.files['0'];
    this.setState({
      photo
    });
  };

  /* submit */

  sendMessage = () => {
    const { message, threadId, photo } = this.state;
    const headers = getHeader();
    if (threadId) {
      const data = {
        text: message,
        author: 'user',
        thread_id: threadId,
      };
      axios({
        headers,
        method: 'post',
        url: `${API_URL}/messages`,
        data
      })
        .then(res => {
          if (res.data.MESSAGE) {
            this.setState({
              alertMessage: res.data.MESSAGE
            });
          }
        })
        .catch(error => console.log(error));
    } else {
      const bodyFormData = new FormData();
      bodyFormData.append('image', photo);
      bodyFormData.set('text', message);
      headers['Content-Type'] = 'multipart/form-data';

      axios({
        headers,
        method: 'post',
        url: `${API_URL}`,
        data: bodyFormData
      })
        .then(res => {
          this.setState({
            alertMessage: res.data.MESSAGE,
            threadId: res.data.threadId
          });
        })
        .catch(err => console.log(err));
    }
    this.setState({
      showAlert: true
    });
    setTimeout(this.props.setShowChat, 4000);
  };

  render() {
    const { setShowChat, showChat } = this.props;
    const { message, showAlert } = this.state;
    return (
      <Modal
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        show={showChat}
        onHide={() => setShowChat()}
      >
        <div className="region-header">
          <Modal.Header id="title-box" closeButton>
            <Modal.Title>Вопрос эксперту</Modal.Title>
          </Modal.Header>
        </div>
        <Modal.Body className="region-box">
          <Form>
            <Form.Group>
              <Form.Label>Задайте ваш вопрос</Form.Label>
              <Form.Control
                as="textarea"
                rows="3"
                onChange={e => this.handleMessage(e)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Вы можете загрузить фото</Form.Label>
              <Form.Control type="file" onChange={e => this.handlePhoto(e)} />
            </Form.Group>
            {showAlert ? (
              <Alert variant="success">
                Благодарим за Ваш вопрос. Наш эксперт свяжется с вами в
                ближайшее время.
              </Alert>
            ) : null}
            <div className="mt-4">
              <Button disabled={!message} onClick={() => this.sendMessage()}>
                Отправить
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    );
  }
}
