import React from 'react';
import { Modal, Collapse, Typography } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import './HelpModal.css';

const { Panel } = Collapse;
const { Title, Paragraph, Text } = Typography;

const HelpModal = ({ visible, onClose, helpData }) => {
  if (!helpData) return null;

  return (
    <Modal
      title={
        <div className="help-modal-title">
          <QuestionCircleOutlined style={{ marginRight: 12, color: '#1890ff' }} />
          <span>{helpData.title} - Help & Documentation</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="help-modal"
      centered
    >
      <div className="help-modal-content">
        <Collapse 
          defaultActiveKey={['0']} 
          ghost
          expandIconPosition="end"
        >
          {helpData.sections.map((section, index) => (
            <Panel 
              header={<Text strong style={{ fontSize: '15px', color: '#062d54' }}>{section.title}</Text>} 
              key={index}
              className="help-panel"
            >
              {section.content && (
                <Paragraph className="help-paragraph">
                  {section.content}
                </Paragraph>
              )}
              
              {section.items && (
                <div className="help-items">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="help-item">
                      {item.subtitle && (
                        <Text strong className="help-item-subtitle">
                          {item.subtitle}
                        </Text>
                      )}
                      <Paragraph className="help-item-description">
                        {item.description}
                      </Paragraph>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          ))}
        </Collapse>
        
        <div className="help-footer">
          <Paragraph type="secondary" style={{ margin: 0, fontSize: '12px', textAlign: 'center' }}>
            Need more help? Contact your system administrator or support team.
          </Paragraph>
        </div>
      </div>
    </Modal>
  );
};

export default HelpModal;
