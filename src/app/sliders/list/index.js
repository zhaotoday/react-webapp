import React from 'react'
import connect from 'react-redux/lib/components/connect'
import actionCreators from '../../../redux/actions'
import time from 'utils/time'
import {Breadcrumb, Form, Button, message, Popconfirm} from 'antd'
import consts from 'utils/consts'
import Ellipsis from 'components/ellipsis'
import List from 'components/list'
import Delete from 'components/delete'
import SliderForm from '../components/form'

module.exports = @connect(
  state => ({
    sliders: state.sliders
  }),
  dispatch => ({
    getSliders: (options) => dispatch(actionCreators.getSliders(options)),
    deleteSlider: (options) => dispatch(actionCreators.deleteSlider(options))
  })
)
class Comp extends React.Component {
  constructor() {
    super()
    this.model = ''
  }

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  // 当前页码
  current = 0

  // 当前搜索参数
  search = {
    is: false,
    keyword: ''
  }

  state = {
    pid: '0'
  }

  componentDidMount() {
    this._getData()
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !nextProps.sliders.isPending
  }

  render() {
    const {sliders, params} = this.props
    this.model = consts.MODELS[params.model] || consts.MODELS.ARTICLES

    // 列表属性
    let listProps = {
      keyName: 'id',
      columns: [{
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        render: (text, record) => {
          return <span className="btn-action" onClick={this._handleModify.bind(null, record.id)}>
            <Ellipsis value={text} width="300" />
          </span>
        }
      }, {
        title: '排序',
        dataIndex: 'sort',
        key: 'sort',
        width: 150
      }, {
        title: '发布时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 150,
        render: (text, record) => {
          return <span>
            {time.getDateTime(record.created_at)}
          </span>
        }
      }, {
        title: '操作',
        key: 'action',
        width: 100,
        render: (text, record) => <span>
          <span className="btn-action" onClick={this._handleModify.bind(null, record.id)}>编辑</span>
          <span className="ant-divider" />
          <Popconfirm title="确认删除该记录？" onConfirm={this._handleDelete.bind(null, record.id)} okText="确认" cancelText="取消">
            <span className="btn-action">删除</span>
          </Popconfirm>
        </span>
      }],
      dataSource: sliders.data ? sliders.data.items : [],
      pagination: {
        current: this.current,
        pageSize: consts.PAGE_SIZE,
        total: sliders.data ? sliders.data.total : 0
      },
      getData: this._getData
    }

    return <div>
      <Breadcrumb>
        <Breadcrumb.Item href="/#/">首页</Breadcrumb.Item>
        <Breadcrumb.Item>系统设置</Breadcrumb.Item>
        <Breadcrumb.Item>首页滚动广告</Breadcrumb.Item>
      </Breadcrumb>
      <div className="actions">
        <Form className="action" inline>
          <Form.Item>
            <Button type="primary" onClick={this._handleAdd}>新增</Button>
          </Form.Item>
          <Form.Item>
            <Delete onValidate={this._handleDeleteValidate} onConfirm={this._handleDelete} />
          </Form.Item>
        </Form>
      </div>
      <List ref="list" {...listProps} />
      <SliderForm provideController={(component) => {
        this.sliderForm = component
      }} onReload={() => {
        this._getData()
      }} />
    </div>
  }

  /**
   * 获取数据
   */
  _getData = (current = 1) => {
    this.current = current

    // 搜索参数
    const searchParams = this.search.is ? {title: this.search.keyword, pid: this.state.pid || '0'} : {pid: '0'}

    return this.props.getSliders({
      params: {
        model: this.model,
        limit: consts.PAGE_SIZE,
        offset: (current - 1) * consts.PAGE_SIZE,
        'order_by': 'sort,id desc',
        ...searchParams
      }
    }).then(() => {
      this.refs.pid && this.refs.pid.reload()
    })
  }

  /**
   * 检查是否符合删除条件
   */
  _handleDeleteValidate = () => {
    const {selectedRowKeys} = this.refs.list

    return new Promise((resolve, reject) => {
      if (selectedRowKeys.length) {
        resolve()
      } else {
        reject()
        message.error('没有选中记录')
      }
    })
  }

  /**
   * 删除
   * @param {string} id 待删除 ID
   */
  _handleDelete = (id) => {
    if (!id) {
      const {selectedRowKeys} = this.refs.list
      id = selectedRowKeys.join(',')
    }

    this.props.deleteSlider({
      params: {
        id: id
      }
    }).then(() => {
      message.success('删除成功')
      // FIX: 删除后，选中状态有问题的 BUG
      this.refs.list.selectedRowKeys = []
      this._getData()
    })
  }

  /**
   * 新增
   */
  _handleAdd = () => {
    const {sliderForm} = this
    sliderForm.show()
    sliderForm.init({
      pid: this.state.pid || '0'
    })
  }

  /**
   * 编辑
   */
  _handleModify = (id) => {
    const {sliderForm} = this
    sliderForm.show()
    sliderForm.init({id})
  }
}
