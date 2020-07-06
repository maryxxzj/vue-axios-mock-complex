<template>
  <div>
    <h1>{{ msg }}</h1>
    <ul v-for="(item,index) in dateList" :key="index">
      <li style="margin-bottom: 10px;">
        <span style="padding-right: 20px;">{{item.author_name}}</span>
        <span style="padding-right: 20px;">{{item.title}}</span>
        <span style="padding-right: 20px;">{{item.date}}</span>
      </li>
    </ul>
  </div>
</template>

<script>
    const testService = require('../request/api')
    export default {
        name: 'HelloWorld',
        data() {
            return {
                msg: 'Welcome mock',
                dateList: []
            }
        },
        mounted: function () {
            this.getTest();
        },
        methods: {
            getTest() {
                let _this = this;
                testService.testList().then(res => {
                    _this.dateList = res.data;
                })
                console.log(_this.dateList);
            }
        }
    }
</script>

<style scoped>
  h1 {
    font-weight: normal;
    text-align: center;
  }

  ul {
    list-style: none;
    text-align: left;
  }
</style>
