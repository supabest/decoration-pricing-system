import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';

const Dashboard: React.FC = () => {
  return (
    <div>
      <h1>控制台</h1>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="进行中项目" value={0} /></Card></Col>
        <Col span={6}><Card><Statistic title="基准价条目" value={0} /></Card></Col>
        <Col span={6}><Card><Statistic title="材料价格" value={0} /></Card></Col>
        <Col span={6}><Card><Statistic title="定额库" value={0} /></Card></Col>
      </Row>
    </div>
  );
};

export default Dashboard;
